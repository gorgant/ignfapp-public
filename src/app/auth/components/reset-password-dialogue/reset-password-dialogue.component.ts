import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { UiService } from 'src/app/core/services/ui.service';
import { AuthStoreActions, AuthStoreSelectors, RootStoreState } from 'src/app/root-store';

@Component({
  selector: 'app-reset-password-dialogue',
  templateUrl: './reset-password-dialogue.component.html',
  styleUrls: ['./reset-password-dialogue.component.scss']
})
export class ResetPasswordDialogueComponent implements OnInit {

  FORM_VALIDATION_MESSAGES = UserRegistrationFormValidationMessages;

  RESET_PASSWORD_TITLE = GlobalFieldValues.RP_RESET_PASSWORD;
  SUBMIT_BUTTON_VALUE = GlobalFieldValues.SUBMIT;
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;

  private resetPasswordError$!: Observable<{} | null>;
  resetPasswordProcessing$!: Observable<boolean>;
  private $resetPasswordSubmitted = signal(false);
  private resetPasswordSubscription!: Subscription;

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ResetPasswordDialogueComponent>);
  private emailString: string = inject(MAT_DIALOG_DATA);
  private store$ = inject(Store<RootStoreState.AppState>);
  private uiService = inject(UiService);

  resetPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });


  constructor() { }

  ngOnInit() {
    this.initForm();
    this.monitorResetRequests();
  }

  initForm() {
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
    this.$resetPasswordSubmitted.set(true);
    this.postResetActions();
  }

  postResetActions() {
    this.resetPasswordSubscription = this.resetPasswordError$
      .pipe(
        map(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating dialog', processingError);
            this.resetPasswordSubscription?.unsubscribe();
            this.resetComponentActionState();
          }
          return processingError; 
        }),
        withLatestFrom(this.resetPasswordProcessing$),
        filter(([processingError, resetProcessing]) => !processingError ), // Halts function if processingError detected
        tap(([processingError, resetProcessing]) => {
          if (!resetProcessing && this.$resetPasswordSubmitted()) {
            this.dialogRef.close(true);
          }
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

  private resetComponentActionState() {
    this.$resetPasswordSubmitted.set(false);
  }

  // These getters are used for easy access in the HTML template
  get email() { return this.resetPasswordForm.get('email') as AbstractControl; }

  ngOnDestroy(): void {
    this.resetPasswordSubscription?.unsubscribe();
    
  }

}
