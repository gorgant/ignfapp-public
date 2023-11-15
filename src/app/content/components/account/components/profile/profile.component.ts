import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription, catchError, filter, map, switchMap, take, tap, throwError, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { ActionConfData } from 'shared-models/forms/action-conf-data.model';
import { PublicImagePaths } from 'shared-models/routes-and-paths/image-paths.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { AuthStoreActions, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';
import { selectPublicUserData } from 'src/app/root-store/user-store/selectors';
import { ActionConfirmDialogueComponent } from 'src/app/shared/components/action-confirm-dialogue/action-confirm-dialogue.component';
import { EditAvatarDialogueComponent } from './edit-avatar-dialogue/edit-avatar-dialogue.component';
import { EditEmailDialogueComponent } from './edit-email-dialogue/edit-email-dialogue.component';
import { EditNameDialogueComponent } from './edit-name-dialogue/edit-name-dialogue.component';
import { EditPasswordDialogueComponent } from './edit-password-dialogue/edit-password-dialogue.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  EDIT_BUTTON_VALUE = GlobalFieldValues.EDIT;
  CHANGE_PASSWORD_BUTTON_VALUE = GlobalFieldValues.CHANGE_PASSWORD;
  DELETE_PUBLIC_USER_BUTTON_VALUE = GlobalFieldValues.DELETE_PUBLIC_USER_CONF_TITLE;
  DELETE_PUBLIC_USER_CONF_BODY = GlobalFieldValues.DELETE_PUBLIC_USER_CONF_BODY;
  DELETE_PUBLIC_USER_CONF_TITLE = GlobalFieldValues.DELETE_PUBLIC_USER_CONF_TITLE;

  userData$!: Observable<PublicUser>;

  defaultProfileImage = PublicImagePaths.DEFAULT_PROFILE_IMAGE_ICON;

  private deletePublicUserProcessing$!: Observable<boolean>;
  private deletePublicUserSubscription!: Subscription;
  private deletePublicUserError$!: Observable<{} | null>;
  private deletePublicUserSubmitted = signal(false);
  private $deletePublicUserCycleInit = signal(false);
  private $deletePublicUserCycleComplete = signal(false);

  private defaultMatDialogConfigOptions: MatDialogConfig = {
    disableClose: false,
    width: '90%',
    maxWidth: '600px',
    autoFocus: false
  };

  private store$ = inject(Store);
  private dialog = inject(MatDialog);
  private uiService = inject(UiService);

  constructor() { }

  ngOnInit(): void {
    this.fetchUserData();
    this.monitorProcesses();
  }

  monitorProcesses() {
    this.deletePublicUserProcessing$ = this.store$.select(UserStoreSelectors.selectDeletePublicUserProcessing);
    this.deletePublicUserError$ = this.store$.select(UserStoreSelectors.selectDeletePublicUserError);
  }

  fetchUserData(): void {
    this.userData$ = this.store$.pipe(select(selectPublicUserData)) as Observable<PublicUser>;
  }

  onEditName() {
    this.userData$
      .pipe(
        take(1),
        tap(user => {
          const dialogConfig = this.defaultMatDialogConfigOptions;
          dialogConfig.data = user;
          const dialogRef = this.dialog.open(EditNameDialogueComponent, dialogConfig);  
        })
      ).subscribe();
  }

  onEditEmail() {
    this.userData$
      .pipe(
        take(1),
        tap(user => {
          const dialogConfig = this.defaultMatDialogConfigOptions;
          dialogConfig.data = user;
          const dialogRef = this.dialog.open(EditEmailDialogueComponent, dialogConfig);  
        })
      ).subscribe();
  }

  onEditPassword() {
    const dialogConfig = this.defaultMatDialogConfigOptions;
    const dialogRef = this.dialog.open(EditPasswordDialogueComponent, dialogConfig);
  }

  onEditAvatar() {
    const dialogConfig = this.defaultMatDialogConfigOptions;
    const dialogRef = this.dialog.open(EditAvatarDialogueComponent, dialogConfig);
  }

  onDeletePublicUser() {
    console.log('Delete public user detected');
    this.deletePublicUserSubscription = this.deletePublicUserError$
      .pipe(
        map(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.deletePublicUserSubscription?.unsubscribe();
            this.resetComponentActionState();
          }
          return processingError;
        }),
        filter(processingError => !processingError ), // Halts function if processingError detected
        switchMap(processingError => {
          const dialogConfig = this.defaultMatDialogConfigOptions;
          const actionConfData: ActionConfData = {
            title: this.DELETE_PUBLIC_USER_CONF_TITLE,
            body: this.DELETE_PUBLIC_USER_CONF_BODY,
          };
          dialogConfig.data = actionConfData;
          const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);
          const dialogClosedResponse$ = dialogRef.afterClosed() as Observable<boolean>
          return dialogClosedResponse$;
        }),
        withLatestFrom(this.userData$),
        filter(([userActionConfirmed, userData]) => userActionConfirmed),
        switchMap(([userActionConfirmed, userData]) => {
          if (!this.deletePublicUserSubmitted()) {
            this.deletePublicUserSubmitted.set(true);
            console.log('User action confirmed', userActionConfirmed);
            this.store$.dispatch(UserStoreActions.deletePublicUserRequested({publicUserId: userData.id}));
          }
          return this.deletePublicUserProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(deleteProcessing => {
          if (deleteProcessing) {
            this.$deletePublicUserCycleInit.set(true);
          }
          if (!deleteProcessing && this.$deletePublicUserCycleInit()) {
            console.log('deletePublicUser successful, proceeding with pipe.');
            this.$deletePublicUserCycleInit.set(false);
            this.$deletePublicUserCycleComplete.set(true);
          }
        }),
        filter(deleteProcessing => !deleteProcessing && this.$deletePublicUserCycleComplete()),
        tap(deletionProcessing => {
          this.store$.dispatch(AuthStoreActions.logout()); // This handles all the UI purging and navigating
          this.uiService.showSnackBar(`User Deleted!`, 5000);
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.deletePublicUserSubscription?.unsubscribe();
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetComponentActionState();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetComponentActionState() {
    this.deletePublicUserSubmitted.set(false);
    this.$deletePublicUserCycleInit.set(false);
    this.$deletePublicUserCycleComplete.set(false);
  }

  ngOnDestroy(): void {
      this.deletePublicUserSubscription?.unsubscribe();
  }



}
