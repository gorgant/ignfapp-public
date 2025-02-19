import { Component, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { Validators, AbstractControl, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { Store } from '@ngrx/store';
import { catchError, combineLatest, filter, map, Observable, Subscription, switchMap, tap, throwError, withLatestFrom } from 'rxjs';
import { PasswordConfirmationData } from 'shared-models/auth/password-confirmation-data.model';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UserRegistrationFormFieldKeys } from 'shared-models/forms/user-registration-form-vals.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { UserStoreSelectors, UserStoreActions, AuthStoreSelectors, AuthStoreActions } from 'src/app/root-store';
import { EditNameDialogueComponent } from '../edit-name-dialogue/edit-name-dialogue.component';
import { FirebaseError } from '@angular/fire/app';
import { NgClass, AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProcessingSpinnerComponent } from 'src/app/shared/components/processing-spinner/processing-spinner.component';

@Component({
    selector: 'app-edit-email-dialogue',
    templateUrl: './edit-email-dialogue.component.html',
    styleUrls: ['./edit-email-dialogue.component.scss'],
    imports: [MatStepperModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogClose, ProcessingSpinnerComponent, NgClass, AsyncPipe]
})
export class EditEmailDialogueComponent implements OnInit, OnDestroy {

  private $updateEmailStepper = viewChild.required<MatStepper>('updateEmailStepper');

  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  CONFIRM_NEW_EMAIL_BLURB = GlobalFieldValues.CONFIRM_NEW_EMAIL;
  EMAIL_FIELD_VALUE = GlobalFieldValues.EMAIL;
  INPUT_NEW_EMAIL_STEP_LABLE = GlobalFieldValues.INPUT_NEW_EMAIL;
  IVE_CONFIRMED_MY_EMAIL_BUTTON_VALUE = GlobalFieldValues.IVE_CONFIRMED_MY_EMAIL;
  SEND_UPDATE_EMAIL_CONFIRMATION = GlobalFieldValues.SEND_UPDATE_EMAIL_CONFIRMATION;
  SEND_UPDATE_EMAIL_BUTTON_VALUE = GlobalFieldValues.SEND_UPDATE_EMAIL_CONFIRMATION;
  UPDATE_EMAIL_TITLE_VALUE = GlobalFieldValues.UPDATE_EMAIL;
  VERIFY_PASSWORD_BUTTON_VALUE = GlobalFieldValues.VERIFY_PASSWORD;
  VERIFY_PASSWORD_STEP_LABEL = GlobalFieldValues.VERIFY_PASSWORD;

  private confirmPasswordProcessing$!: Observable<boolean>;
  private confirmPasswordSubscription!: Subscription;
  private confirmPasswordError$!: Observable<{} | null>;
  private $confirmPasswordSubmitted = signal(false);
  private $confirmPasswordCycleInit = signal(false);
  private $confirmPasswordCycleComplete = signal(false);

  private sendUpdateEmailConfirmationProcessing$!: Observable<boolean>;
  private sendUpdateEmailConfirmationSubscription!: Subscription;
  private sendUpdateEmailConfirmationError$!: Observable<{} | null>;
  private $sendUpdateEmailConfirmationSubmitted = signal(false);
  private $sendUpdateEmailConfirmationCycleInit = signal(false);
  $sendUpdateEmailConfirmationCycleComplete = signal(false);
  
  combinedAuthAndUserUpdateProcessing$!: Observable<boolean>;

  userData$!: Observable<PublicUser>;

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EditNameDialogueComponent>);
  private store$ = inject(Store);
  private uiService = inject(UiService);
  originalUserData: PublicUser = inject(MAT_DIALOG_DATA);

  passwordForm = this.fb.group({
    [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required]],
  });

  emailForm = this.fb.group({
    [PublicUserKeys.EMAIL]: ['', [Validators.required, Validators.email]],
  });
  
  constructor() { }

  ngOnInit() {
    this.monitorUpdateRequests();
  }

  get passwordErrorMessage() {
    let errorMessage = '';
    if (this.password.hasError('required')) {
      return errorMessage = 'You must enter a value';
    }
    return errorMessage;
  }

  get emailErrorMessage() {
    let errorMessage = '';
    if (this.email.hasError('required')) {
      return errorMessage = 'You must enter a value';
    }
    if (this.email.hasError('email')) {
      return errorMessage =  'Not a valid email.';
    }
    return errorMessage;
  }

  private monitorUpdateRequests(): void {

    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;

    this.confirmPasswordProcessing$ = this.store$.select(AuthStoreSelectors.selectConfirmPasswordProcessing);
    this.confirmPasswordError$ = this.store$.select(AuthStoreSelectors.selectConfirmPasswordError);
    
    this.sendUpdateEmailConfirmationProcessing$ = this.store$.select(UserStoreSelectors.selectSendUpdateEmailConfirmationProcessing);
    this.sendUpdateEmailConfirmationError$ = this.store$.select(UserStoreSelectors.selectSendUpdateEmailConfirmationError);

    this.combinedAuthAndUserUpdateProcessing$ = combineLatest([
        this.confirmPasswordProcessing$,
        this.sendUpdateEmailConfirmationProcessing$,
      ]).pipe(
        map(([confirmingPassword, sendingEmail]) => {
          if (confirmingPassword || sendingEmail) {
            return true
          }
          return false
        })
    );
  }

  onConfirmPasswordInAuth() {
    if (!this.password.dirty) {
      this.uiService.showSnackBar(`You must provide your password to proceed!`, 10000);
      return;
    }

    this.confirmPasswordSubscription = this.confirmPasswordError$
      .pipe(
        map(processingError => {
          const errMsg = (processingError as FirebaseError)?.message;
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetConfirmPasswordComponentState();
            // Keep dialog open unless the error isn't related to a wrong password entry
            if (!errMsg.includes('wrong-password')) {
              this.dialogRef.close();
            }
          }
          return processingError;
        }),
        filter(processingError => !processingError ), // Halts function if processingError detected
        switchMap(processingError => {
          if (!this.$confirmPasswordSubmitted()) {
            const confirmPasswordData: PasswordConfirmationData = {
              email: this.originalUserData.email,
              password: this.password.value,
            };
            this.$confirmPasswordSubmitted.set(true);
            this.store$.dispatch(AuthStoreActions.confirmPasswordRequested({confirmPasswordData}));
          }
          return this.confirmPasswordProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(confirmPasswordProcessing => {
          if (confirmPasswordProcessing) {
            this.$confirmPasswordCycleInit.set(true);
          }
          if (!confirmPasswordProcessing && this.$confirmPasswordCycleInit()) {
            console.log('confirmPassword successful, proceeding with pipe.');
            this.$confirmPasswordCycleInit.set(false);
            this.$confirmPasswordCycleComplete.set(true);
          }
        }),
        filter(confirmPasswordProcessing => !confirmPasswordProcessing && this.$confirmPasswordCycleComplete()),
        tap(confirmPasswordProcessing => {
          // If password confirmation succeeds, proceed to next step
          this.confirmPasswordSubscription?.unsubscribe(); // Clear subscription no longer needed
          const stepOne = this.$updateEmailStepper().steps.get(0); 
          if (stepOne) {
            stepOne.completed = true;
            this.confirmPasswordSubscription?.unsubscribe();        
            this.$updateEmailStepper().next() // Programatically trigger the stepper to move to the next step
          }
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetConfirmPasswordComponentState();
          this.dialogRef.close(false);
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetConfirmPasswordComponentState() {
    this.confirmPasswordSubscription?.unsubscribe();
    this.$confirmPasswordSubmitted.set(false);
    this.passwordForm.reset();
    this.$confirmPasswordCycleInit.set(false);
    this.$confirmPasswordCycleComplete.set(false);
    this.store$.dispatch(AuthStoreActions.purgeAuthErrors());
  }

  onSendUpdateEmailConfirmation() {
    if (!this.email.dirty) {
      this.uiService.showSnackBar(`You must provide your new email to proceed!`, 10000);
      return;
    }

    this.sendUpdateEmailConfirmationSubscription = this.sendUpdateEmailConfirmationError$
      .pipe(
        map(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating dialog');
            this.resetSendUpdateEmailComponentState();
            this.dialogRef.close(false);
          }
          return processingError;
        }),
        withLatestFrom(this.userData$),
        filter(([processingError, userData]) => !processingError), // Halts function if processingError detected
        switchMap(([processingError, userData]) => {
          if (!this.$sendUpdateEmailConfirmationSubmitted()) {
            // Provide the new email to the user data
            const updatedUserData: PublicUser = {
              ...userData,
              [PublicUserKeys.EMAIL]: this.email.value
            }
            this.store$.dispatch(UserStoreActions.sendUpdateEmailConfirmationRequested({userData: updatedUserData}));
            this.$sendUpdateEmailConfirmationSubmitted.set(true);
          }
          return this.sendUpdateEmailConfirmationProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(updateProcessing => {
          if (updateProcessing) {
            this.$sendUpdateEmailConfirmationCycleInit.set(true);
          }
          if (!updateProcessing && this.$sendUpdateEmailConfirmationCycleInit()) {
            console.log('sendUpdateEmailConfirmation successful, proceeding with pipe.');
            this.$sendUpdateEmailConfirmationCycleInit.set(false);
            this.$sendUpdateEmailConfirmationCycleComplete.set(true);
          }
        }),
        filter(updateProcessing => !updateProcessing && this.$sendUpdateEmailConfirmationCycleComplete()),
        tap(sendEmailProcessing => {
          this.sendUpdateEmailConfirmationSubscription?.unsubscribe();
          // Don't close dialog yet so that we can display follow-up instructions to user
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetSendUpdateEmailComponentState();
          this.dialogRef.close(false);
          return throwError(() => new Error(error));
        })
      )
      .subscribe();
  }

  private resetSendUpdateEmailComponentState() {
    this.sendUpdateEmailConfirmationSubscription?.unsubscribe();
    this.emailForm.reset();
    this.$sendUpdateEmailConfirmationSubmitted.set(false);
    this.$sendUpdateEmailConfirmationCycleComplete.set(false);
    this.$sendUpdateEmailConfirmationCycleInit.set(false);
    this.store$.dispatch(UserStoreActions.purgePublicUserErrors());
  }

  // These getters are used for easy access in the HTML template
  get password() { return this.passwordForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }
  get email() { return this.emailForm.get(PublicUserKeys.EMAIL) as AbstractControl; }

  ngOnDestroy(): void {
    this.confirmPasswordSubscription?.unsubscribe();
    this.sendUpdateEmailConfirmationSubscription?.unsubscribe();
  }

}
