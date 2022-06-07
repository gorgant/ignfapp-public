import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { AuthStoreActions, AuthStoreSelectors, RootStoreState } from 'src/app/root-store';

@Component({
  selector: 'app-reset-password-dialogue',
  templateUrl: './reset-password-dialogue.component.html',
  styleUrls: ['./reset-password-dialogue.component.scss']
})
export class ResetPasswordDialogueComponent implements OnInit {

  resetPasswordForm!: FormGroup;
  FORM_VALIDATION_MESSAGES = UserRegistrationFormValidationMessages;

  RESET_PASSWORD_TITLE = GlobalFieldValues.RP_RESET_PASSWORD;
  SUBMIT_BUTTON_VALUE = GlobalFieldValues.SUBMIT;
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;

  resetPasswordProcessing$!: Observable<boolean>;
  resetPasswordSubmitted!: boolean;
  resetPasswordError$!: Observable<{} | undefined>;
  resetPasswordSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ResetPasswordDialogueComponent>,
    @Inject(MAT_DIALOG_DATA) private emailString: string,
    private store$: Store<RootStoreState.AppState>,
  ) { }

  ngOnInit() {
    this.initForm();
    this.monitorResetRequests();
  }

  initForm() {
    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    if (this.emailString) {
      this.resetPasswordForm.patchValue({
        email: this.emailString
      });
    }
  }

  monitorResetRequests() {
    this.resetPasswordProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectIsResettingPassword));
    this.resetPasswordError$ = this.store$.pipe(select(AuthStoreSelectors.selectResetPasswordError));
  }

  onSubmit() {
    const email = this.email.value;
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
          console.log('Error resetting password, resetting form');
          this.resetPasswordSubscription.unsubscribe();
          this.resetPasswordSubmitted = false;
          return;
        }

        if (!resetProcessing && this.resetPasswordSubmitted) {
          this.dialogRef.close(true);
        }

      });
  }

  // These getters are used for easy access in the HTML template
  get email() { return this.resetPasswordForm.get('email') as AbstractControl; }

  ngOnDestroy(): void {
    if (this.resetPasswordSubscription) {
      this.resetPasswordSubscription.unsubscribe();
    }
    
  }

}
