import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription, take, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { ActionConfData } from 'shared-models/forms/action-conf-data.model';
import { PublicImagePaths } from 'shared-models/routes-and-paths/image-paths.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { AuthStoreActions, RootStoreState, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';
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
  loading$!: Observable<boolean>;

  defaultProfileImage = PublicImagePaths.DEFAULT_PROFILE_IMAGE_ICON;

 deletePublicUserProcessing$!: Observable<boolean>;
 deletePublicUserSubscription!: Subscription;
 deletePublicUserError$!: Observable<{} | null>;
 deletePublicUserSubmitted!: boolean;

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private dialog: MatDialog,
    private uiService: UiService,
    private router: Router
  ) { }

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
      .pipe(take(1))
      .subscribe(user => {
        const dialogConfig = new MatDialogConfig();

        dialogConfig.disableClose = false;
        dialogConfig.width = '90%';
        dialogConfig.maxWidth = '600px';

        dialogConfig.data = user;

        const dialogRef = this.dialog.open(EditNameDialogueComponent, dialogConfig);
      });
  }

  onEditEmail() {

    this.userData$
      .pipe(take(1))
      .subscribe(user => {
        const dialogConfig = new MatDialogConfig();

        dialogConfig.disableClose = false;
        dialogConfig.width = '90%';
        dialogConfig.maxWidth = '600px';

        dialogConfig.data = user;

        dialogConfig.autoFocus = false;

        const dialogRef = this.dialog.open(EditEmailDialogueComponent, dialogConfig);
      });
  }

  onEditPassword() {

    this.userData$
      .pipe(take(1))
      .subscribe(user => {
        const dialogConfig = new MatDialogConfig();

        dialogConfig.disableClose = false;
        dialogConfig.width = '90%';
        dialogConfig.maxWidth = '600px';

        dialogConfig.data = user;

        const dialogRef = this.dialog.open(EditPasswordDialogueComponent, dialogConfig);
      });
  }

  onEditAvatar() {

    this.userData$
      .pipe(take(1))
      .subscribe(user => {
        const dialogConfig = new MatDialogConfig();

        dialogConfig.disableClose = false;
        dialogConfig.width = '90%';
        dialogConfig.maxWidth = '600px';

        dialogConfig.data = user;
        dialogConfig.autoFocus = false;

        const dialogRef = this.dialog.open(EditAvatarDialogueComponent, dialogConfig);
      });
  }

  onDeletePublicUser() {
    this.userData$
      .pipe(take(1))
      .subscribe(user => {
        const dialogConfig = new MatDialogConfig();

        dialogConfig.disableClose = false;
        dialogConfig.width = '90%';
        dialogConfig.maxWidth = '600px';

        dialogConfig.data = user;
        dialogConfig.autoFocus = false;

        const actionConfData: ActionConfData = {
          title: this.DELETE_PUBLIC_USER_CONF_TITLE,
          body: this.DELETE_PUBLIC_USER_CONF_BODY,
        };
    
        dialogConfig.data = actionConfData;

        const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);
        
        dialogRef.afterClosed().subscribe(confirmed => {
          if (confirmed) {
            this.store$.dispatch(UserStoreActions.deletePublicUserRequested({publicUserId: user.id}));
            this.store$.dispatch(AuthStoreActions.logout()); // This handles all the UI purging and navigating
            this.postDeletePublicUserActions();
          }
        });
      });
  }

  private postDeletePublicUserActions() {
    this.deletePublicUserSubscription = this.deletePublicUserProcessing$
      .pipe(
        withLatestFrom(
          this.deletePublicUserError$,
        ),
      )
      .subscribe(([deletionProcessing, deletionError]) => {
        if (deletionProcessing) {
          this.deletePublicUserSubmitted = true;
        }

        if (deletionError) {
          console.log('Error deleting publicUser in database, terminating function');
          this.deletePublicUserSubscription.unsubscribe();
          this.deletePublicUserSubmitted = false;
          return;
        }

        if (!deletionProcessing && this.deletePublicUserSubmitted) {
          console.log('delete publicUser successful.');
          this.uiService.showSnackBar(`User Deleted!`, 5000);
          this.deletePublicUserSubscription.unsubscribe();
        }
      })
  }

  ngOnDestroy(): void {
    if (this.deletePublicUserSubscription) {
      this.deletePublicUserSubscription.unsubscribe();
    }
  }



}
