import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { combineLatest, map, Observable, Subscription, withLatestFrom } from 'rxjs';
import { EmailUpdateData } from 'shared-models/auth/email-update-data.model';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UserRegistrationFormFieldKeys } from 'shared-models/forms/user-registration-form-vals.model';
import { UserProfileFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from 'shared-models/user/user-update.model';
import { RootStoreState, UserStoreSelectors, UserStoreActions, AuthStoreSelectors, AuthStoreActions } from 'src/app/root-store';
import { EditNameDialogueComponent } from '../edit-name-dialogue/edit-name-dialogue.component';

@Component({
  selector: 'app-edit-email-dialogue',
  templateUrl: './edit-email-dialogue.component.html',
  styleUrls: ['./edit-email-dialogue.component.scss']
})
export class EditEmailDialogueComponent implements OnInit, OnDestroy {

  
  
  emailForm!: FormGroup;
  formValidationMessages = UserProfileFormValidationMessages;

  titleFiledValue = GlobalFieldValues.EDIT_EMAIL;
  emailFieldValue = GlobalFieldValues.EMAIL;
  saveButtonValue = GlobalFieldValues.SAVE;
  cancelButtonValue = GlobalFieldValues.CANCEL;

  authEmailUpdateProcessing$!: Observable<boolean>;
  authEmailUpdateSubscription!: Subscription;
  authEmailUpdateError$!: Observable<{} | undefined>;
  authEmailUpdateSubmitted!: boolean;
  
  authOrUserUpdateProcessing$!: Observable<boolean>;

  userUpdateProcessing$!: Observable<boolean>;
  userUpdateError$!: Observable<{} | undefined>;
  userUpdateSubscription!: Subscription;
  userUpdateSubmitted!: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditNameDialogueComponent>,
    @Inject(MAT_DIALOG_DATA) private userData: PublicUser,
    private store$: Store<RootStoreState.AppState>,
  ) { }

  ngOnInit() {
    this.initForm();
    this.monitorUpdateRequests();
  }

  private initForm(): void {
    this.emailForm = this.fb.group({
      [PublicUserKeys.EMAIL]: ['', [Validators.required, Validators.email]],
      [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required]],
    });

    // Patch in existing data if it exists
    this.emailForm.patchValue({
      [PublicUserKeys.EMAIL]: this.userData.email,
    });
  }

  private monitorUpdateRequests(): void {
    
    // this.authOrUserUpdateProcessing$ = combineLatest(
    //   [
    //     this.store$.pipe(select(AuthStoreSelectors.selectIsUpdatingEmail)),
    //     this.store$.pipe(select(UserStoreSelectors.selectIsUpdatingUser))
    //   ]
    // ).pipe(
    //     map(([authenticating, updatingUser]) => {
    //       if (authenticating || updatingUser) {
    //         return true
    //       }
    //       return false
    //     })
    // );

    this.authEmailUpdateProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectIsUpdatingEmail));
    this.authEmailUpdateError$ = this.store$.pipe(select(AuthStoreSelectors.selectUpdateEmailError));

    this.userUpdateProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectIsUpdatingUser));
    this.userUpdateError$ = this.store$.pipe(select(UserStoreSelectors.selectUserUpdateError));
  }

  onSubmit() {
    this.updateEmailInAuth();
  }

  updateEmailInAuth() {
    const emailUpdateData: EmailUpdateData = {
      oldEmail: this.userData.email,
      password: this.password.value,
      newEmail: this.email.value
    }

    this.store$.dispatch(AuthStoreActions.updateEmailRequested({emailUpdateData}));
    this.updateEmailInFirebase();
  }
  
  updateEmailInFirebase() {

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
            updateType: UserUpdateType.BIO_UPDATE
          };
      
          this.store$.dispatch(UserStoreActions.updateUserRequested({userUpdateData}));
          this.postUserUpdateActions();
        }
      })
  }

  postUserUpdateActions() {
    this.userUpdateSubscription = this.userUpdateProcessing$
      .pipe(
        withLatestFrom(this.userUpdateError$)
      )
      .subscribe(([updateProcessing, updateError]) => {

        console.log(`updateUserProcessing subscription fired, userUpdateProcessing status: ${updateProcessing}`);

        if (updateProcessing) {
          this.userUpdateSubmitted = true;
        }
        
        // If error updating user in database, cancel operation
        if (updateError) {
          console.log('Error updating email in user database, resetting form');
          this.userUpdateSubscription.unsubscribe();
          this.userUpdateSubmitted = false;
          return;
        }
        
        if (!updateProcessing && this.userUpdateSubmitted) {
          console.log('Closing dialogue box');
          this.dialogRef.close(true);
        }
        
      })
  }
  
  // These getters are used for easy access in the HTML template
  get email() { return this.emailForm.get(PublicUserKeys.EMAIL) as AbstractControl; }
  get password() { return this.emailForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }

  ngOnDestroy(): void {
    
    if (this.userUpdateSubscription) {
      this.userUpdateSubscription.unsubscribe();
    }

    if (this.authEmailUpdateSubscription) {
      this.authEmailUpdateSubscription.unsubscribe();
    }

  }

}
