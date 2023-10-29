import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Validators, AbstractControl, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatStepper, StepperOrientation } from '@angular/material/stepper';
import { Store, select } from '@ngrx/store';
import { catchError, combineLatest, filter, map, Observable, Subscription, switchMap, tap, throwError } from 'rxjs';
import { PasswordConfirmationData } from 'shared-models/auth/password-confirmation-data.model';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UserRegistrationFormFieldKeys } from 'shared-models/forms/user-registration-form-vals.model';
import { UserProfileFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { UserStoreSelectors, UserStoreActions, AuthStoreSelectors, AuthStoreActions } from 'src/app/root-store';
import { EditNameDialogueComponent } from '../edit-name-dialogue/edit-name-dialogue.component';
import { FirebaseError } from '@angular/fire/app';

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
  INPUT_NEW_EMAIL_STEP_LABLE = GlobalFieldValues.INPUT_NEW_EMAIL;
  IVE_CONFIRMED_MY_EMAIL_BUTTON_VALUE = GlobalFieldValues.IVE_CONFIRMED_MY_EMAIL;
  SEND_UPDATE_EMAIL_CONFIRMATION = GlobalFieldValues.SEND_UPDATE_EMAIL_CONFIRMATION;
  SEND_UPDATE_EMAIL_BUTTON_VALUE = GlobalFieldValues.SEND_UPDATE_EMAIL_CONFIRMATION;
  UPDATE_EMAIL_TITLE_VALUE = GlobalFieldValues.UPDATE_EMAIL;
  VERIFY_PASSWORD_BUTTON_VALUE = GlobalFieldValues.VERIFY_PASSWORD;
  VERIFY_PASSWORD_STEP_LABEL = GlobalFieldValues.VERIFY_PASSWORD;

  private confirmPasswordProcessing$!: Observable<boolean>;
  private passwordConfirmationSubscription!: Subscription;
  private confirmPasswordError$!: Observable<{} | null>;
  private passwordConfirmationSubmitted = signal(false);

  private sendUpdateEmailConfirmationProcessing$!: Observable<boolean>;
  private sendUpdateEmailConfirmationSubscription!: Subscription;
  private sendUpdateEmailConfirmationError$!: Observable<{} | null>;
  private sendUpdateEmailConfirmationSubmitted = signal(false);
  sendUpdateEmailConfirmationSucceded = signal(false);
  
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
    this.monitorUpdateRequests();
    this.setStepperOrientation();
  }

  private monitorUpdateRequests(): void {

    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectPublicUserData)) as Observable<PublicUser>;

    this.confirmPasswordProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectConfirmPasswordProcessing));
    this.confirmPasswordError$ = this.store$.pipe(select(AuthStoreSelectors.selectConfirmPasswordError));
    
    this.sendUpdateEmailConfirmationProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectSendUpdateEmailConfirmationProcessing));
    this.sendUpdateEmailConfirmationError$ = this.store$.pipe(select(UserStoreSelectors.selectSendUpdateEmailConfirmationError));

    this.authOrUserUpdateProcessing$ = combineLatest([
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
    this.passwordConfirmationSubmitted.set(true);
    this.postPasswordConfirmationActions();
  }
  
  private postPasswordConfirmationActions() {

    this.passwordConfirmationSubscription = this.confirmPasswordError$
      .pipe(
        switchMap(processingError => {
          const errMsg = (processingError as FirebaseError)?.message;
          if (processingError) {
            console.log('processingError detected, terminating dialog', processingError);
            this.resetComponentActionState();
            // Keep dialog open unless the error isn't related to a wrong password entry
            if (!errMsg.includes('wrong-password')) {
              this.dialogRef.close();
            }
          }
          return combineLatest([this.confirmPasswordProcessing$, this.confirmPasswordError$]);
        }),
        filter(([passwordUpdateProcessing, processingError]) => !processingError ), // Halts function if processingError detected
        tap(([passwordUpdateProcessing, authError]) => {
          // If password confirmation succeeds, proceed to next step
          if (this.passwordConfirmationSubmitted() && !passwordUpdateProcessing) {
            console.log('Password confirmation successful');
            this.passwordConfirmationSubscription?.unsubscribe(); // Clear subscription no longer needed
            const stepOne = this.updateEmailStepper.steps.get(0); 
            if (stepOne) {
              stepOne.completed = true;
              this.updateEmailStepper.next() // Programatically trigger the stepper to move to the next step
              if (this.passwordConfirmationSubscription) {
                this.passwordConfirmationSubscription?.unsubscribe();
              }
            }
          }  
        })
      )
      .subscribe();
  }
  
  onSendUpdateEmailConfirmation() {
    this.sendUpdateEmailConfirmationSubscription = this.sendUpdateEmailConfirmationError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating dialog');
            this.resetComponentActionState();
            this.dialogRef.close(false);
          }
          return combineLatest([this.userData$, this.sendUpdateEmailConfirmationError$]);
        }),
        filter(([userData, processingError]) => !processingError), // Halts function if processingError detected
        switchMap(([userData, processingError]) => {
          if (!this.sendUpdateEmailConfirmationSubmitted()) {
            // Provide the new email to the user data
            const updatedUserData: PublicUser = {
              ...userData,
              [PublicUserKeys.EMAIL]: this.email.value
            }
            this.store$.dispatch(UserStoreActions.sendUpdateEmailConfirmationRequested({userData: updatedUserData}));
            this.sendUpdateEmailConfirmationSubmitted.set(true);
          }
          return this.sendUpdateEmailConfirmationProcessing$;
        }),
        tap(sendEmailProcessing => {
          if (this.sendUpdateEmailConfirmationSubmitted() && !sendEmailProcessing) {
            console.log('sendUpdateEmailConfirmation succeeded');
            this.sendUpdateEmailConfirmationSubscription?.unsubscribe();
            this.sendUpdateEmailConfirmationSucceded.set(true);
          }
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetComponentActionState();
          this.dialogRef.close(false);
          return throwError(() => new Error(error));
        })
      )
      .subscribe();
  }

  private resetComponentActionState() {
    this.passwordConfirmationSubmitted.set(false);
    this.passwordForm.reset();
    this.sendUpdateEmailConfirmationSubmitted.set(false);
    this.emailForm.reset();
    this.sendUpdateEmailConfirmationSucceded.set(false);
  }

  // These getters are used for easy access in the HTML template
  get password() { return this.passwordForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }
  get email() { return this.emailForm.get(PublicUserKeys.EMAIL) as AbstractControl; }

  ngOnDestroy(): void {
    this.passwordConfirmationSubscription?.unsubscribe();
    this.sendUpdateEmailConfirmationSubscription?.unsubscribe();
  }

}
