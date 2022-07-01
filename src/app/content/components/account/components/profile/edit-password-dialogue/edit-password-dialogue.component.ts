import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { AuthStoreActions, AuthStoreSelectors, RootStoreState } from 'src/app/root-store';

@Component({
  selector: 'app-edit-password-dialogue',
  templateUrl: './edit-password-dialogue.component.html',
  styleUrls: ['./edit-password-dialogue.component.scss']
})
export class EditPasswordDialogueComponent implements OnInit {

  TITLE_FIELD_VALUE = GlobalFieldValues.CHANGE_PASSWORD;
  CHANGE_PASSWORD_BLURB = GlobalFieldValues.CHANGE_PASSWORD_BLURB;
  SUBMIT_BUTTON_VALUE = GlobalFieldValues.SUBMIT;
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;

  resetPasswordProcessing$!: Observable<boolean>;
  resetPasswordSubmitted!: boolean;
  resetPasswordError$!: Observable<{} | null>;
  resetPasswordSubscription!: Subscription;

  
  constructor(
    private dialogRef: MatDialogRef<EditPasswordDialogueComponent>,
    @Inject(MAT_DIALOG_DATA) public userData: PublicUser,
    private store$: Store<RootStoreState.AppState>,
  ) { }

  ngOnInit(): void {
    this.monitorResetRequests();
  }

  monitorResetRequests() {
    this.resetPasswordProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectResetPasswordProcessing));
    this.resetPasswordError$ = this.store$.pipe(select(AuthStoreSelectors.selectResetPasswordError));
  }

  onSubmit() {
    const email = this.userData.email;
    this.store$.dispatch(AuthStoreActions.resetPasswordRequested({email}));

    this.resetPasswordSubmitted = true;
    
    this.postResetActions();
  }

  postResetActions() {
    this.resetPasswordSubscription = this.resetPasswordProcessing$
      .pipe(
        withLatestFrom(this.resetPasswordError$)
      )
      .subscribe(([resetProcessing, resetError]) => {
        if (resetError) {
          console.log('Error resetting password, terminating request.');
          this.resetPasswordSubscription.unsubscribe();
          this.resetPasswordSubmitted = false;
          return;
        }

        if (!resetProcessing && this.resetPasswordSubmitted) {
          this.dialogRef.close(true);
        }
      });
  }

}
