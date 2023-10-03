import { Component, Inject, OnInit, inject } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { tap, withLatestFrom } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { AuthStoreActions, AuthStoreSelectors, RootStoreState } from 'src/app/root-store';

@Component({
  selector: 'app-reset-password-dialogue',
  templateUrl: './reset-password-dialogue.component.html',
  styleUrls: ['./reset-password-dialogue.component.scss']
})
export class ResetPasswordDialogueComponent implements OnInit {

  resetPasswordForm!: UntypedFormGroup;
  FORM_VALIDATION_MESSAGES = UserRegistrationFormValidationMessages;

  RESET_PASSWORD_TITLE = GlobalFieldValues.RP_RESET_PASSWORD;
  SUBMIT_BUTTON_VALUE = GlobalFieldValues.SUBMIT;
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;

  resetPasswordProcessing$!: Observable<boolean>;
  private resetPasswordSubmitted!: boolean;
  private resetPasswordError$!: Observable<{} | null>;
  private resetPasswordSubscription!: Subscription;

  private fb = inject(UntypedFormBuilder);
  private dialogRef = inject(MatDialogRef<ResetPasswordDialogueComponent>);
  private emailString: string = inject(MAT_DIALOG_DATA);
  private store$ = inject(Store<RootStoreState.AppState>);

  constructor() { }

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
    this.resetPasswordProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectResetPasswordProcessing));
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
        withLatestFrom(this.resetPasswordError$),
        tap(([resetProcessing, resetError]) => {

          if (resetError) {
            console.log('Error resetting password, resetting form', resetError);
            this.resetPasswordSubmitted = false;
            return;
          }

          if (!resetProcessing && this.resetPasswordSubmitted) {
            this.dialogRef.close(true);
          }
        })
      )
      .subscribe();
  }

  // These getters are used for easy access in the HTML template
  get email() { return this.resetPasswordForm.get('email') as AbstractControl; }

  ngOnDestroy(): void {
    if (this.resetPasswordSubscription) {
      this.resetPasswordSubscription.unsubscribe();
    }
    
  }

}
