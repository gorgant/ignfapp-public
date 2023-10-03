import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Validators, AbstractControl, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatStepper, StepperOrientation } from '@angular/material/stepper';
import { Store, select } from '@ngrx/store';
import { combineLatest, map, Observable, Subscription, switchMap, tap } from 'rxjs';
import { PasswordConfirmationData } from 'shared-models/auth/password-confirmation-data.model';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UserRegistrationFormFieldKeys } from 'shared-models/forms/user-registration-form-vals.model';
import { UserProfileFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { UserStoreSelectors, UserStoreActions, AuthStoreSelectors, AuthStoreActions } from 'src/app/root-store';
import { EditNameDialogueComponent } from '../edit-name-dialogue/edit-name-dialogue.component';

@Component({
  selector: 'app-edit-email-dialogue',
  templateUrl: './edit-email-dialogue.component.html',
  styleUrls: ['./edit-email-dialogue.component.scss']
})
export class EditEmailDialogueComponent implements OnInit, OnDestroy {

  @ViewChild('updateEmailStepper') private updateEmailStepper!: MatStepper;

  stepperOrientation!: StepperOrientation;
  
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  CONFIRM_NEW_EMAIL_BLURB = GlobalFieldValues.CONFIRM_NEW_EMAIL;
  EMAIL_FIELD_VALUE = GlobalFieldValues.EMAIL;
  FORM_VALIDATION_MESSAGES = UserProfileFormValidationMessages;
  IVE_CONFIRMED_MY_EMAIL_BUTTON_VALUE = GlobalFieldValues.IVE_CONFIRMED_MY_EMAIL;
  SEND_UPDATE_EMAIL_CONFIRMATION = GlobalFieldValues.SEND_UPDATE_EMAIL_CONFIRMATION;
  UPDATE_EMAIL_BUTTON_VALUE = GlobalFieldValues.SEND_UPDATE_EMAIL_CONFIRMATION;
  UPDATE_EMAIL_TITLE_VALUE = GlobalFieldValues.SEND_UPDATE_EMAIL_CONFIRMATION;
  VERIFY_PASSWORD_BUTTON_VALUE = GlobalFieldValues.VERIFY_PASSWORD;
  VERIFY_PASSWORD_STEP_LABEL = GlobalFieldValues.VERIFY_PASSWORD;

  private passwordConfirmationProcessing$!: Observable<boolean>;
  private passwordConfirmationSubscription!: Subscription;
  private passwordConfirmationError$!: Observable<{} | null>;
  private passwordConfirmationSubmitted!: boolean;

  private sendUpdateEmailConfirmationProcessing$!: Observable<boolean>;
  private sendUpdateEmailConfirmationSubscription!: Subscription;
  private sendUpdateEmailConfirmationError$!: Observable<{} | null>;
  private sendUpdateEmailConfirmationSubmitted!: boolean;
  sendUpdateEmailConfirmationSucceded!: boolean;
  
  authOrUserUpdateProcessing$!: Observable<boolean>;

  private userData$!: Observable<PublicUser>;

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EditNameDialogueComponent>);
  private store$ = inject(Store);
  private uiService = inject(UiService);
  private userData: PublicUser = inject(MAT_DIALOG_DATA);

  passwordForm = this.fb.group({
    [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required]],
  });

  emailForm = this.fb.group({
    [PublicUserKeys.EMAIL]: ['', [Validators.required, Validators.email]],
  });
  
  
    
  constructor() { }

  ngOnInit() {
    this.initForm();
    this.monitorUpdateRequests();
    this.setStepperOrientation();
  }

  private initForm(): void {
    // Patch in existing data if it exists
    this.emailForm.patchValue({
      [PublicUserKeys.EMAIL]: this.userData.email,
    });
  }

  private monitorUpdateRequests(): void {

    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectPublicUserData)) as Observable<PublicUser>;

    this.passwordConfirmationProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectConfirmPasswordProcessing));
    this.passwordConfirmationError$ = this.store$.pipe(select(AuthStoreSelectors.selectConfirmPasswordError));
    
    this.sendUpdateEmailConfirmationProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectSendUpdateEmailConfirmationProcessing));
    this.sendUpdateEmailConfirmationError$ = this.store$.pipe(select(UserStoreSelectors.selectSendUpdateEmailConfirmationError));

    this.authOrUserUpdateProcessing$ = combineLatest([
        this.passwordConfirmationProcessing$,
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

  private setStepperOrientation(): void {
    this.uiService.screenIsMobile.subscribe(isMobile => {
      if (isMobile) {
        this.stepperOrientation = 'vertical'
      } else {
        this.stepperOrientation = 'horizontal'
      }
    })
  }

  onConfirmPasswordInAuth() {
    const passwordConfirmationData: PasswordConfirmationData = {
      email: this.userData.email,
      password: this.password.value,
    }

    this.store$.dispatch(AuthStoreActions.confirmPasswordRequested({passwordConfirmationData}));
    this.postPasswordConfirmationActions();
  }
  
  private postPasswordConfirmationActions() {

    this.passwordConfirmationSubscription = combineLatest([this.passwordConfirmationProcessing$, this.passwordConfirmationError$])
      .pipe(
        tap(([passwordUpdateProcessing, authError]) => {
          if (passwordUpdateProcessing) {
            this.passwordConfirmationSubmitted = true;
          }
  
          // If error in auth, cancel operation
          if (authError) {
            console.log('Error confirming password in auth, resetting form');
            this.passwordConfirmationSubscription.unsubscribe();
            this.passwordConfirmationSubmitted = false;
            this.passwordForm.reset(); // Prevents user from proceeding manually to next step by clicking in stepper
            return;
          }
          
          // If password confirmation succeeds, proceed to next step
          if (this.passwordConfirmationSubmitted && !passwordUpdateProcessing) {
            console.log('Password confirmation successful');
            this.passwordConfirmationSubscription.unsubscribe(); // Clear subscription no longer needed
            this.proceedToNextStep();
          }  
        })
      )
      .subscribe();
  }

  // Programatically trigger the stepper to move to the next step
  private proceedToNextStep() {
    this.updateEmailStepper.next()
  }

  onSendUpdateEmailConfirmation() {
    this.sendUpdateEmailConfirmationSubscription = combineLatest([this.userData$, this.sendUpdateEmailConfirmationProcessing$])
      .pipe(
        switchMap(([userData, sendEmailProcessing]) => {
          if (!this.sendUpdateEmailConfirmationSubmitted && !sendEmailProcessing) {
            // Provide the new email to the user data
            const updatedUserData: PublicUser = {
              ...userData,
              [PublicUserKeys.EMAIL]: this.email.value
            }
            this.store$.dispatch(UserStoreActions.sendUpdateEmailConfirmationRequested({userData: updatedUserData}));
          }
          return combineLatest([this.sendUpdateEmailConfirmationProcessing$, this.sendUpdateEmailConfirmationError$])
        }),
        tap(([sendEmailProcessing, sendEmailError]) => {
          if (sendEmailProcessing) {
            this.sendUpdateEmailConfirmationSubmitted = true;
          }
  
          // If error in auth, cancel operation
          if (sendEmailError) {
            console.log('Error sending email, resetting form');
            this.sendUpdateEmailConfirmationSubscription.unsubscribe();
            this.sendUpdateEmailConfirmationSubmitted = false;
            this.emailForm.reset(); // Prevents user from proceeding manually to next step by clicking in stepper
            return;
          }
          
          // If password confirmation succeeds, proceed to next step
          if (this.passwordConfirmationSubmitted && !sendEmailProcessing) {
            console.log('sendUpdateEmailConfirmation succeeded');
            this.sendUpdateEmailConfirmationSubscription.unsubscribe();
            this.sendUpdateEmailConfirmationSucceded = true;
          }
        })
      )
      .subscribe();
  }

  // These getters are used for easy access in the HTML template
  get password() { return this.passwordForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }
  get email() { return this.emailForm.get(PublicUserKeys.EMAIL) as AbstractControl; }

  ngOnDestroy(): void {
    
    if (this.passwordConfirmationSubscription) {
      this.passwordConfirmationSubscription.unsubscribe();
    }

    if (this.sendUpdateEmailConfirmationSubscription) {
      this.sendUpdateEmailConfirmationSubscription.unsubscribe();
    }

  }

}
