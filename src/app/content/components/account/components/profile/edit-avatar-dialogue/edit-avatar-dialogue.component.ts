import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { catchError, combineLatest, filter, map, Observable, Subscription, switchMap, tap, throwError, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { ProductionCloudStorage, SandboxCloudStorage } from 'shared-models/environments/env-vars.model';
import { AvatarImageData } from 'shared-models/images/avatar-image-data.model';
import { AvatarImageMetaData } from 'shared-models/images/image-metadata.model';
import { ImageType } from 'shared-models/images/image-type.model';
import { PublicCSDirectoryPaths } from 'shared-models/routes-and-paths/cs-directory-paths.model';
import { PublicImagePaths } from 'shared-models/routes-and-paths/image-paths.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from 'shared-models/user/user-update.model';
import { HelperService } from 'src/app/core/services/helpers.service';
import { UiService } from 'src/app/core/services/ui.service';
import { RootStoreState, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';
import { DateTime } from 'luxon';
import { AsyncPipe } from '@angular/common';
import { ProcessingSpinnerComponent } from '../../../../../../shared/components/processing-spinner/processing-spinner.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-edit-avatar-dialogue',
    templateUrl: './edit-avatar-dialogue.component.html',
    styleUrls: ['./edit-avatar-dialogue.component.scss'],
    standalone: true,
    imports: [MatButtonModule, MatDialogClose, ProcessingSpinnerComponent, AsyncPipe]
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

  $resizeAvatarCycleInit = signal(false);
  private $resizeAvatarCycleComplete = signal(false);
  private $resizeAvatarSubmitted = signal(false);
  private resizeAvatarError$!: Observable<{} | null>;
  private resizeAvatarProcessing$!: Observable<boolean>;
  private resizeAvatarSucceeded$!: Observable<boolean>;

  userData$!: Observable<PublicUser>;
  // private userUpdateError$!: Observable<{} | null>;
  // private userUpdateProcessing$!: Observable<boolean>;

  combinedUploadAvatarProcessing$!: Observable<boolean>;
  combinedUploadAvatarError$!: Observable<{} | null>;

  private dialogRef = inject(MatDialogRef<EditAvatarDialogueComponent>);
  private store$ = inject(Store<RootStoreState.AppState>);
  private uiService = inject(UiService);
  private helperService = inject(HelperService);

  constructor() { }

  ngOnInit(): void {
    this.monitorUpdateRequests();
  }

  private monitorUpdateRequests(): void {

    this.avatarDownloadUrl$ = this.store$.select(UserStoreSelectors.selectAvatarDownloadUrl);
    this.uploadAvatarError$ = this.store$.select(UserStoreSelectors.selectUploadAvatarError);
    this.uploadAvatarProcessing$ = this.store$.select(UserStoreSelectors.selectUploadAvatarProcessing);

    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;
    // this.userUpdateError$ = this.store$.select(UserStoreSelectors.selectUpdatePublicUserError);
    // this.userUpdateProcessing$ = this.store$.select(UserStoreSelectors.selectUpdatePublicUserProcessing);

    this.resizeAvatarError$ = this.store$.select(UserStoreSelectors.selectResizeAvatarError);
    this.resizeAvatarProcessing$ = this.store$.select(UserStoreSelectors.selectResizeAvatarProcessing);
    this.resizeAvatarSucceeded$ = this.store$.select(UserStoreSelectors.selectResizeAvatarSucceeded);

    this.combinedUploadAvatarProcessing$ = combineLatest(
      [
        this.uploadAvatarProcessing$,
        this.resizeAvatarProcessing$,
      ]
    ).pipe(
        map(([uploadingAvatar, resizingAvatar]) => {
          if (uploadingAvatar || resizingAvatar) {
            return true
          }
          return false
        })
    );

    this.combinedUploadAvatarError$ = combineLatest(
      [
        this.uploadAvatarError$,
        this.resizeAvatarError$,
      ]
    ).pipe(
        map(([uploadError, resizeError]) => {
          if (uploadError || resizeError) {
            return uploadError || resizeError;
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
    let originalImageUrl: string;
    // 1) Get user data 2) resize avatar image in cloud function (which also updates user) 3) wait for user avatarUrl update 4) close dialogue
    this.processAvatarImageSubscription = this.combinedUploadAvatarError$
      .pipe(
        map(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating dialog', processingError);
            this.resetComponentState();
            this.dialogRef.close(false);
          }
          return processingError;
        }),
        withLatestFrom(this.userData$),
        filter(([processingError, userData]) => !processingError ), // Halts function if processingError detected
        switchMap(([processingError, userData]) => {
          console.log('processAvatarImage triggered');
          if (!this.$avatarImageDataSubmitted()) {
            originalImageUrl = userData[PublicUserKeys.AVATAR_URL] || 'none';
            this.$avatarImageDataSubmitted.set(true);
            const avatarData = this.generateImageData(imageFile, userData);
            if (!avatarData) {
              throw new Error('Error generating avatar image data!');
            }
            this.avatarImageData = avatarData;
            this.store$.dispatch(UserStoreActions.uploadAvatarRequested({avatarData}));
          }
          return this.avatarDownloadUrl$
        }),
        filter(downloadUrl => !!downloadUrl),
        switchMap(downloadUrl => {
          console.log('avatar upload successful, proceeding with pipe');
          if (!this.$resizeAvatarSubmitted()) {
            this.$resizeAvatarSubmitted.set(true);
            this.$resizeAvatarCycleInit.set(true);
            const imageMetaData = this.avatarImageData.imageMetadata;
            // Note, this cloud function also updates the user
            this.store$.dispatch(UserStoreActions.resizeAvatarRequested({imageMetaData}));
          }
          return combineLatest([this.resizeAvatarSucceeded$, this.userData$]);
        }),
        filter(([resizeSucceeded, userData]) => resizeSucceeded && originalImageUrl !== userData[PublicUserKeys.AVATAR_URL]),
        tap(resizeSucceeded => {
          console.log('Avatar resize complete, closing dialogue box');
          this.$resizeAvatarCycleInit.set(false);
          this.$resizeAvatarCycleComplete.set(true);
          this.dialogRef.close(true);
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetComponentState();
          this.dialogRef.close(false);
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetComponentState() {
    this.processAvatarImageSubscription?.unsubscribe();
    this.$avatarImageDataSubmitted.set(false);
    this.$resizeAvatarSubmitted.set(false);
    this.$resizeAvatarCycleInit.set(false);
    this.$resizeAvatarCycleComplete.set(true);
    this.store$.dispatch(UserStoreActions.purgePublicUserErrors());
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
    const fileNameNoExt: string = `${ImageType.AVATAR}-${DateTime.now().toMillis()}`;
    const imageMetadata: AvatarImageMetaData = {
      contentType: file.type,
      customMetadata: {
        fileExt: this.helperService.sanitizeFileName(file).fileExt,
        fileNameNoExt,
        filePath: this.generateAvatarImagePath(file, fileNameNoExt, userData),
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

  private generateAvatarImagePath(file: File, fileNameNoExt: string, userData: PublicUser): string {
    const userId = userData.id;
    const folder = `${userId}/${PublicCSDirectoryPaths.AVATAR}`;
    const name = `${fileNameNoExt}.${this.helperService.sanitizeFileName(file).fileExt}`;
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
