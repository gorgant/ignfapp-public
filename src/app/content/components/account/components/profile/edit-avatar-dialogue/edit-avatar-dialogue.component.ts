import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { combineLatest, map, Observable, Subscription, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { ProductionCloudStorage, SandboxCloudStorage } from 'shared-models/environments/env-vars.model';
import { AvatarImageData } from 'shared-models/images/avatar-image-data.model';
import { AvatarImageMetaData } from 'shared-models/images/image-metadata.model';
import { ImageType } from 'shared-models/images/image-type.model';
import { PublicCSDirectoryPaths } from 'shared-models/routes-and-paths/cs-directory-paths.model';
import { PublicImagePaths } from 'shared-models/routes-and-paths/image-paths.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from 'shared-models/user/user-update.model';
import { UiService } from 'src/app/core/services/ui.service';
import { RootStoreState, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';
import { environment } from 'src/environments/environment';

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

  uploadAvatarProcessing$!: Observable<boolean>;
  uploadAvatarSubscription!: Subscription;
  uploadAvatarError$!: Observable<{} | undefined>;
  uploadAvatarSubmitted!: boolean;
  uploadAvatarConfirmed!: boolean;
  avatarDownloadUrl$!: Observable<string | undefined>;

  resizeAvatarProcessing$!: Observable<boolean>;
  resizeAvatarSubscription!: Subscription;
  resizeAvatarError$!: Observable<{} | undefined>;
  resizeAvatarSubmitted!: boolean;
  resizeAvatarConfirmed!: boolean;

  userUpdateProcessing$!: Observable<boolean>;
  userUpdateError$!: Observable<{} | undefined>;
  userUpdateSubscription!: Subscription;
  userUpdateSubmitted!: boolean;

  avatarUploadOrUserUpdateProcessing$!: Observable<boolean>;

  avatarImageData!: AvatarImageData;

  constructor(
    private dialogRef: MatDialogRef<EditAvatarDialogueComponent>,
    @Inject(MAT_DIALOG_DATA) public userData: PublicUser,
    private uiService: UiService,
    private store$: Store<RootStoreState.AppState>,
  ) { }

  ngOnInit(): void {
    this.monitorUpdateRequests();
  }

  private monitorUpdateRequests(): void {

    this.uploadAvatarProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectIsUploadingAvatar));
    this.uploadAvatarError$ = this.store$.pipe(select(UserStoreSelectors.selectUploadAvatarError));
    this.avatarDownloadUrl$ = this.store$.pipe(select(UserStoreSelectors.selectAvatarDownloadUrl));
    
    this.userUpdateProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectIsUpdatingUser));
    this.userUpdateError$ = this.store$.pipe(select(UserStoreSelectors.selectUpdateUserError));

    this.resizeAvatarProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectIsResizingAvatar));
    this.resizeAvatarError$ = this.store$.pipe(select(UserStoreSelectors.selectResizeAvatarError));

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
  }
  

  onSubmit(event: Event) {
    const fileList: FileList | null = (event.target as HTMLInputElement).files;
    const file: File | null = fileList ? fileList[0] : null;

    // Confirm valid file type
    if (file?.type.split('/')[0] !== 'image') {
      this.uiService.showSnackBar('Invalid file type. Please try again.', 7000);
      return;
    }

    if (file?.size > (10 * 1000000)) {
      this.uiService.showSnackBar('Image is too large. Please choose an image that is less than 10MB.', 7000);
      return;
    }

    const imageMetadata: AvatarImageMetaData = {
      contentType: file.type,
      customMetadata: {
        fileExt: this.uiService.sanitizeFileName(file).fileExt,
        fileNameNoExt: ImageType.AVATAR,
        filePath: this.generateAvatarImagePath(file, this.userData),
        imageType: ImageType.AVATAR,
        publicUserId: this.userData.id,
        resizedImage: 'false',
        storageBucket: this.getPublicUsersBucketBasedOnEnvironment()
      }
    };

    const avatarData: AvatarImageData = {
      file,
      imageMetadata
    };

    this.avatarImageData = avatarData;

    this.store$.dispatch(UserStoreActions.uploadAvatarRequested({avatarData}));
    this.postSubmitActions();
  }

  postSubmitActions() {
    this.uploadAvatarSubscription = this.avatarDownloadUrl$
      .pipe(
        withLatestFrom(this.uploadAvatarProcessing$, this.uploadAvatarError$)
      )
      .subscribe(([downloadUrl, uploadAvatarProcessing, uploadError]) => {
        
        if (uploadAvatarProcessing) {
          this.uploadAvatarSubmitted = true;
        }

        // If error in upload, cancel operation
        if (uploadError) {
          console.log('Error uploading avatar, terminating process.');
          this.uploadAvatarSubscription.unsubscribe();
          this.uploadAvatarSubmitted = false;
          return;
        }
        
        // If upload succeeds, proceed to next step
        if (downloadUrl) {
          this.uploadAvatarConfirmed = true;

          const userUpdateData: UserUpdateData = {
            userData: { 
              id: this.userData.id,
              avatarUrl: downloadUrl 
            },
            updateType: UserUpdateType.BIO_UPDATE
          };

          console.log(`Updating avatar with this url: ${downloadUrl}`);

          this.uploadAvatarSubscription.unsubscribe(); // Clear subscription no longer needed
          
          this.store$.dispatch(UserStoreActions.updateUserRequested({userUpdateData}));
          this.postUserUpdateActions();
        }
      })
  }

  private postUserUpdateActions() {
    this.userUpdateSubscription = this.userUpdateProcessing$
      .pipe(
        withLatestFrom(this.userUpdateError$)
      )
      .subscribe(([updateProcessing, updateError]) => {

        if (updateProcessing) {
          this.userUpdateSubmitted = true;
        }
        
        // If error updating user in database, cancel operation and revert previous auth changes
        if (updateError) {
          console.log('Error updating avatar url in user database, terminating process');
          this.userUpdateSubscription.unsubscribe();
          this.userUpdateSubmitted = false;
          return;
        }
        
        if (!updateProcessing && this.userUpdateSubmitted) {
          console.log('User update suceeded, submitting resize avatar request');

          const imageMetaData = this.avatarImageData.imageMetadata;
          
          this.store$.dispatch(UserStoreActions.resizeAvatarRequested({imageMetaData}));

          this.postResizeAvatarActions();
        }
        
      })
  }

  private postResizeAvatarActions() {
    this.resizeAvatarSubscription = this.resizeAvatarProcessing$
      .pipe(
        withLatestFrom(this.resizeAvatarError$)
      )
      .subscribe(([resizeProcessing, resizeError]) => {

        if (resizeProcessing) {
          this.resizeAvatarSubmitted = true;
        }
        
        // If error submitting resize avatar, cancel operation
        if (resizeError) {
          console.log('Error submitting resize avatar request, terminating process');
          this.resizeAvatarSubscription.unsubscribe();
          this.resizeAvatarSubmitted = false;
          return;
        }
        
        if (!resizeProcessing && this.resizeAvatarSubmitted) {
          console.log('Avatar resize request submitted, closing dialogue box');
          this.dialogRef.close(true);
        }
        
      })
  }

  private generateAvatarImagePath(file: File, userData: PublicUser): string {
    const userId = userData.id;
    const folder = `${userId}/${PublicCSDirectoryPaths.AVATAR}`;
    const name = `${ImageType.AVATAR}.${this.uiService.sanitizeFileName(file).fileExt}`;
    const filePath = `${folder}/${name}`;
    return filePath;
  }

  private getPublicUsersBucketBasedOnEnvironment(): string {
    const storageBucket = environment.production ? ProductionCloudStorage.IGNFAPP_PUBLIC_USERS_STORAGE_GS_PREFIX : SandboxCloudStorage.IGNFAPP_PUBLIC_USERS_STORAGE_GS_PREFIX;
    return storageBucket;
  }

  ngOnDestroy(): void {
    if (this.uploadAvatarSubscription) {
      this.uploadAvatarSubscription.unsubscribe();
    }

    if (this.userUpdateSubscription) {
      this.userUpdateSubscription.unsubscribe();
    }

    if (this.resizeAvatarSubscription) {
      this.resizeAvatarSubscription.unsubscribe();
    }

  }

}
