import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatStepper, StepperOrientation } from '@angular/material/stepper';
import { Store, select } from '@ngrx/store';
import { combineLatest, map, Observable, Subscription, withLatestFrom } from 'rxjs';
import { EmailUpdateData } from 'shared-models/auth/email-update-data.model';
import { PasswordConfirmationData } from 'shared-models/auth/password-confirmation-data.model';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UserRegistrationFormFieldKeys } from 'shared-models/forms/user-registration-form-vals.model';
import { UserProfileFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from 'shared-models/user/user-update.model';
import { UiService } from 'src/app/core/services/ui.service';
import { RootStoreState, UserStoreSelectors, UserStoreActions, AuthStoreSelectors, AuthStoreActions } from 'src/app/root-store';
import { EditNameDialogueComponent } from '../edit-name-dialogue/edit-name-dialogue.component';

@Component({
  selector: 'app-edit-email-dialogue',
  templateUrl: './edit-email-dialogue.component.html',
  styleUrls: ['./edit-email-dialogue.component.scss']
})
export class EditEmailDialogueComponent implements OnInit, OnDestroy {

  @ViewChild('updateEmailStepper') private updateEmailStepper!: MatStepper;

  stepperOrientation!: StepperOrientation;
  
  passwordForm!: UntypedFormGroup;
  emailForm!: UntypedFormGroup;
  FORM_VALIDATION_MESSAGES = UserProfileFormValidationMessages;

  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  EMAIL_FIELD_VALUE = GlobalFieldValues.EMAIL;
  UPDATE_EMAIL_BUTTON_VALUE = GlobalFieldValues.UPDATE_EMAIL;
  UPDATE_EMAIL_STEP_LABEL = GlobalFieldValues.UPDATE_EMAIL;
  UPDATE_EMAIL_TITLE_VALUE = GlobalFieldValues.UPDATE_EMAIL;
  VERIFY_PASSWORD_BUTTON_VALUE = GlobalFieldValues.VERIFY_PASSWORD;
  VERIFY_PASSWORD_STEP_LABEL = GlobalFieldValues.VERIFY_PASSWORD;

  passwordConfirmationProcessing$!: Observable<boolean>;
  passwordConfirmationSubscription!: Subscription;
  passwordConfirmationError$!: Observable<{} | null>;
  passwordConfirmationSubmitted!: boolean;

  authEmailUpdateProcessing$!: Observable<boolean>;
  authEmailUpdateSubscription!: Subscription;
  authEmailUpdateError$!: Observable<{} | null>;
  authEmailUpdateSubmitted!: boolean;
  
  userUpdateProcessing$!: Observable<boolean>;
  userUpdateError$!: Observable<{} | null>;
  userUpdateSubscription!: Subscription;
  userUpdateSubmitted!: boolean;
  
  authOrUserUpdateProcessing$!: Observable<boolean>;

  constructor(
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<EditNameDialogueComponent>,
    @Inject(MAT_DIALOG_DATA) public userData: PublicUser,
    private store$: Store<RootStoreState.AppState>,
    private uiService: UiService
  ) { }

  ngOnInit() {
    this.initForm();
    this.monitorUpdateRequests();
    this.setStepperOrientation();
  }

  private initForm(): void {
    
    this.passwordForm = this.fb.group({
      [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required]],
    });

    this.emailForm = this.fb.group({
      [PublicUserKeys.EMAIL]: ['', [Validators.required, Validators.email]],
    });

    // Patch in existing data if it exists
    this.emailForm.patchValue({
      [PublicUserKeys.EMAIL]: this.userData.email,
    });
  }

  private monitorUpdateRequests(): void {

    this.passwordConfirmationProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectConfirmPasswordProcessing));
    this.passwordConfirmationError$ = this.store$.pipe(select(AuthStoreSelectors.selectConfirmPasswordError));
    
    this.authEmailUpdateProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectUpdateEmailProcessing));
    this.authEmailUpdateError$ = this.store$.pipe(select(AuthStoreSelectors.selectUpdateEmailError));

    this.userUpdateProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectUpdateUserProcessing));
    this.userUpdateError$ = this.store$.pipe(select(UserStoreSelectors.selectUpdateUserError));

    this.authOrUserUpdateProcessing$ = combineLatest(
      [
        this.passwordConfirmationProcessing$,
        this.authEmailUpdateProcessing$,
        this.userUpdateProcessing$
      ]
    ).pipe(
        map(([confirmingPassword, updatingAuth, updatingUser]) => {
          if (confirmingPassword || updatingAuth || updatingUser) {
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

    this.passwordConfirmationSubscription = this.passwordConfirmationProcessing$
      .pipe(
        withLatestFrom(this.passwordConfirmationError$)
      )
      .subscribe(([passwordUpdateProcessing, authError]) => {
        
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
  }

  // Programatically trigger the stepper to move to the next step
  private proceedToNextStep() {
    this.updateEmailStepper.next()
  }

  onUpdateEmail() {
    this.updateEmailInAuth();
  }

  private updateEmailInAuth() {
    const emailUpdateData: EmailUpdateData = {
      newEmail: this.email.value
    }

    this.store$.dispatch(AuthStoreActions.updateEmailRequested({emailUpdateData}));
    this.updateEmailInFirebase();
  }
  
  private updateEmailInFirebase() {

    this.authEmailUpdateSubscription = this.authEmailUpdateProcessing$
      .pipe(
        withLatestFrom(this.authEmailUpdateError$)
      )
      .subscribe(([authUpdateProcessing, authError]) => {
        
        if (authUpdateProcessing) {
          this.authEmailUpdateSubmitted = true;
        }

        // If error in auth, cancel operation
        if (authError) {
          console.log('Error updating email in auth, resetting form');
          this.authEmailUpdateSubscription.unsubscribe();
          this.authEmailUpdateSubmitted = false;
          return;
        }
        
        // If auth email update succeeds, proceed to update user in database
        if (this.authEmailUpdateSubmitted && !authUpdateProcessing) {
          console.log('Auth email update complete, updating user in database');
          
          const userData: Partial<PublicUser> = {
            id: this.userData.id,
            email: this.email.value,
          }
      
          const userUpdateData: UserUpdateData = {
            userData,
            updateType: UserUpdateType.EMAIL_UPDATE
          };
      
          this.authEmailUpdateSubscription.unsubscribe(); // Clear subscription no longer needed

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
          console.log('Error updating email in user database, resetting form');
          this.userUpdateSubscription.unsubscribe();
          this.userUpdateSubmitted = false;
        
          this.revertAuthToOriginalEmail();
          return;
        }
        
        if (!updateProcessing && this.userUpdateSubmitted) {
          console.log('Closing dialogue box');
          this.dialogRef.close(true);
        }
        
      })
  }

  // Revert auth to previous email in the event of a database update error
  private revertAuthToOriginalEmail() {
    console.log('Reverting auth to original email');
    const emailUpdateData: EmailUpdateData = {
      newEmail: this.userData.email // User's original email
    }
    this.store$.dispatch(AuthStoreActions.updateEmailRequested({emailUpdateData}));
  }
  
  // These getters are used for easy access in the HTML template
  get password() { return this.passwordForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }
  get email() { return this.emailForm.get(PublicUserKeys.EMAIL) as AbstractControl; }

  ngOnDestroy(): void {
    
    if (this.passwordConfirmationSubscription) {
      this.passwordConfirmationSubscription.unsubscribe();
    }

    if (this.userUpdateSubscription) {
      this.userUpdateSubscription.unsubscribe();
    }

    if (this.authEmailUpdateSubscription) {
      this.authEmailUpdateSubscription.unsubscribe();
    }

  }

}
