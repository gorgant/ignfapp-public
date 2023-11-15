import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { catchError, combineLatest, filter, map, Observable, Subscription, switchMap, tap, throwError, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { ProductionCloudStorage, SandboxCloudStorage } from 'shared-models/environments/env-vars.model';
import { AvatarImageData } from 'shared-models/images/avatar-image-data.model';
import { AvatarImageMetaData } from 'shared-models/images/image-metadata.model';
import { ImageType } from 'shared-models/images/image-type.model';
import { PublicCSDirectoryPaths } from 'shared-models/routes-and-paths/cs-directory-paths.model';
import { PublicImagePaths } from 'shared-models/routes-and-paths/image-paths.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from 'shared-models/user/user-update.model';
import { HelperService } from 'src/app/core/services/helpers.service';
import { UiService } from 'src/app/core/services/ui.service';
import { RootStoreState, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-edit-avatar-dialogue',
  templateUrl: './edit-avatar-dialogue.component.html',
  styleUrls: ['./edit-avatar-dialogue.component.scss']
})
export class EditAvatarDialogueComponent implements OnInit, OnDestroy {

  DEFAULT_PROFILE_IMAGE = PublicImagePaths.DEFAULT_PROFILE_IMAGE_ICON;

  EDIT_AVATAR_TITLE_VALUE = GlobalFieldValues.EDIT_AVATAR;
  UPLOAD_IMAGE_BUTTON_VALUE = GlobalFieldValues.UPLOAD_IMAGE;
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;

  private avatarImageData!: AvatarImageData;
  private $avatarImageDataSubmitted = signal(false);
  private avatarDownloadUrl$!: Observable<string | null>;
  private processAvatarImageSubscription!: Subscription;
  
  private uploadAvatarProcessing$!: Observable<boolean>;
  private uploadAvatarError$!: Observable<{} | null>;

  private resizeAvatarError$!: Observable<{} | null>;
  private resizeAvatarProcessing$!: Observable<boolean>;
  private $resizeAvatarSubmitted = signal(false);
  private resizeAvatarSucceeded$!: Observable<boolean>;

  userData$!: Observable<PublicUser | null>;
  private userUpdateError$!: Observable<{} | null>;
  private userUpdateProcessing$!: Observable<boolean>;
  private $userUpdateSubmitted = signal(false);
  private $userUpdateCycleInit = signal(false);
  private $userUpdateCycleComplete = signal(false);

  avatarUploadOrUserUpdateProcessing$!: Observable<boolean>;
  avatarUploadOrUserUpdateError$!: Observable<boolean>;

  private dialogRef = inject(MatDialogRef<EditAvatarDialogueComponent>);
  private store$ = inject(Store<RootStoreState.AppState>);
  private uiService = inject(UiService);
  private helperService = inject(HelperService);

  constructor() { }

  ngOnInit(): void {
    this.monitorUpdateRequests();
  }

  private monitorUpdateRequests(): void {

    this.avatarDownloadUrl$ = this.store$.pipe(select(UserStoreSelectors.selectAvatarDownloadUrl));
    this.uploadAvatarError$ = this.store$.pipe(select(UserStoreSelectors.selectUploadAvatarError));
    this.uploadAvatarProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectUploadAvatarProcessing));

    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectPublicUserData));
    this.userUpdateError$ = this.store$.pipe(select(UserStoreSelectors.selectUpdatePublicUserError));
    this.userUpdateProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectUpdatePublicUserProcessing));

    this.resizeAvatarError$ = this.store$.pipe(select(UserStoreSelectors.selectResizeAvatarError));
    this.resizeAvatarProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectResizeAvatarProcessing));
    this.resizeAvatarSucceeded$ = this.store$.pipe(select(UserStoreSelectors.selectResizeAvatarSucceeded));

    this.avatarUploadOrUserUpdateProcessing$ = combineLatest(
      [
        this.uploadAvatarProcessing$,
        this.userUpdateProcessing$,
        this.resizeAvatarProcessing$,
      ]
    ).pipe(
        map(([uploadingAvatar, updatingUser, resizingAvatar]) => {
          if (uploadingAvatar || updatingUser || resizingAvatar) {
            return true
          }
          return false
        })
    );

    this.avatarUploadOrUserUpdateError$ = combineLatest(
      [
        this.uploadAvatarError$,
        this.userUpdateError$,
        this.resizeAvatarError$,
      ]
    ).pipe(
        map(([uploadError, updateError, resizeError]) => {
          if (uploadError || updateError || resizeError) {
            return true
          }
          return false
        })
    );
  }
  
  onSubmit(event: Event) {
    const fileList: FileList | null = (event.target as HTMLInputElement).files;
    const imageFile: File | null = fileList ? fileList[0] : null;
    const isValidImage = this.isValidImage(imageFile);
    if (!imageFile || !isValidImage) {
      return;
    }
    this.processAvatarImage(imageFile);
  }

  private processAvatarImage(imageFile: File) {
    // 1) Get user data 2) add avatar URL to user in DB 3) resize avatar image in cloud function 4) close dialogue
    this.processAvatarImageSubscription = this.avatarUploadOrUserUpdateError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating dialog', processingError);
            this.dialogRef.close(false);
          }
          return combineLatest([this.userData$, this.avatarUploadOrUserUpdateError$]);
        }),
        filter(([userData, processingError]) => !processingError ), // Halts function if processingError detected
        switchMap(([userData, processingError]) => {
          console.log('processAvatarImage triggered');
          if (!this.$avatarImageDataSubmitted()) {
            const avatarData = this.generateImageData(imageFile, userData!);
            if (!avatarData) {
              throw new Error('Error generating avatar image data!');
            }
            this.avatarImageData = avatarData;
            this.store$.dispatch(UserStoreActions.uploadAvatarRequested({avatarData}));
            this.$avatarImageDataSubmitted.set(true);
          }
          return this.avatarDownloadUrl$
        }),
        filter(downloadUrl => !!downloadUrl),
        withLatestFrom(this.userData$),
        switchMap(([downloadUrl, userData]) => {
          if (downloadUrl && !this.$userUpdateSubmitted()) {
            const userUpdateData: UserUpdateData = {
              userData: { 
                id: userData!.id,
                avatarUrl: downloadUrl 
              },
              updateType: UserUpdateType.BIO_UPDATE
            };
            console.log(`Updating avatar with this url: ${downloadUrl}`);
            this.store$.dispatch(UserStoreActions.updatePublicUserRequested({userUpdateData}));
            this.$userUpdateSubmitted.set(true);
          }
          return this.userUpdateProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(updateProcessing => {
          if (updateProcessing) {
            this.$userUpdateCycleInit.set(true);
          }
          if (!updateProcessing && this.$userUpdateCycleInit()) {
            console.log('user update successful, proceeding with pipe.');
            this.$userUpdateCycleInit.set(false);
            this.$userUpdateCycleComplete.set(true);
          }
        }),
        filter(updateProcessing => !updateProcessing && this.$userUpdateCycleComplete()),
        switchMap(updateProcessing => {
          if (!this.$resizeAvatarSubmitted()) {
            const imageMetaData = this.avatarImageData.imageMetadata;
            this.store$.dispatch(UserStoreActions.resizeAvatarRequested({imageMetaData}));
            this.$resizeAvatarSubmitted.set(true);
          }
          return this.resizeAvatarSucceeded$;
        }),
        filter(resizeSucceeded => resizeSucceeded),
        tap(resizeSucceeded => {
          console.log('Avatar resize request submitted, closing dialogue box');
          this.dialogRef.close(true);
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.dialogRef.close(false);
          return throwError(() => new Error(error));
        })
      )
      .subscribe();
  }

  private isValidImage(file: File | null): boolean {
    if (!file) {
      return false;
    }
    // Confirm valid file type
    if (file?.type.split('/')[0] !== 'image') {
      this.uiService.showSnackBar('Invalid file type. Please try again.', 7000);
      return false;
    }

    if (file?.size > (10 * 1000000)) {
      this.uiService.showSnackBar('Image is too large. Please choose an image that is less than 10MB.', 7000);
      return false;
    }
    return true;
  }

  private generateImageData(file: File, userData: PublicUser): AvatarImageData | undefined {
    const imageMetadata: AvatarImageMetaData = {
      contentType: file.type,
      customMetadata: {
        fileExt: this.helperService.sanitizeFileName(file).fileExt,
        fileNameNoExt: ImageType.AVATAR,
        filePath: this.generateAvatarImagePath(file, userData),
        imageType: ImageType.AVATAR,
        publicUserId: userData.id,
        resizedImage: 'false',
        storageBucket: this.getPublicUsersBucketBasedOnEnvironment()
      }
    };

    const avatarData: AvatarImageData = {
      file,
      imageMetadata
    };

    return avatarData;
  }

  private generateAvatarImagePath(file: File, userData: PublicUser): string {
    const userId = userData.id;
    const folder = `${userId}/${PublicCSDirectoryPaths.AVATAR}`;
    const name = `${ImageType.AVATAR}.${this.helperService.sanitizeFileName(file).fileExt}`;
    const filePath = `${folder}/${name}`;
    return filePath;
  }

  private getPublicUsersBucketBasedOnEnvironment(): string {
    const storageBucket = this.helperService.isProductionEnvironment() ? ProductionCloudStorage.IGNFAPP_PUBLIC_USERS_STORAGE_GS_PREFIX : SandboxCloudStorage.IGNFAPP_PUBLIC_USERS_STORAGE_GS_PREFIX;
    return storageBucket;
  }

  ngOnDestroy(): void {
    this.processAvatarImageSubscription?.unsubscribe();
  }

}
