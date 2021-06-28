import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { EmailUserData } from 'shared-models/email/email-user-data.model';
import { EmailSenderAddresses, SendgridContactListId } from 'shared-models/email/email-vars.model';
import { UserRegistrationFormFieldValues, UserRegistrationFormFieldKeys, UserRegistrationButtonValues } from 'shared-models/forms/user-registration-form-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PrelaunchUser } from 'shared-models/user/prelaunch-user.model';
import { RootStoreState, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-pl-signup',
  templateUrl: './pl-signup.component.html',
  styleUrls: ['./pl-signup.component.scss']
})
export class PlSignupComponent implements OnInit {

  registerUserForm!: FormGroup;
  formFieldKeys = UserRegistrationFormFieldKeys;
  formValidationMessages = UserRegistrationFormValidationMessages;
  firstNameFieldValue = UserRegistrationFormFieldValues.FIRST_NAME;
  emailFieldValue = UserRegistrationFormFieldValues.EMAIL;
  submitButtonValue = UserRegistrationButtonValues.REQUEST_INVITE;
  trustedEmailSender = EmailSenderAddresses.IGNFAPP_DEFAULT;
  
  prelaunchUserData$!: Observable<PrelaunchUser>;
  registrationProcessing$!: Observable<boolean>;
  userAlreadyRegistered: boolean = false;
  prelaunchUserSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private afs: AngularFirestore,
    private store: Store<RootStoreState.AppState>
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.monitorStoreContents();
  }

  private initForm(): void {
    this.registerUserForm = this.fb.group({
      [UserRegistrationFormFieldKeys.FIRST_NAME]: ['', [Validators.required]],
      [UserRegistrationFormFieldKeys.EMAIL]: ['', [Validators.required, Validators.email]]
    });
  }

  private monitorStoreContents() {
    this.prelaunchUserData$ = this.store.pipe(select(UserStoreSelectors.selectUserData)) as Observable<PrelaunchUser>;
    this.registrationProcessing$ = this.store.pipe(select(UserStoreSelectors.selectIsUpdatingUser));
  }

  onSubmit(): void {

    console.log('Submitted these values', this.registerUserForm.value);

    const emailUserData: EmailUserData = {
      email: this.email.value,
      firstName: this.firstName.value,
      id: this.afs.createId(),
      emailSendgridContactListArray: [
        SendgridContactListId.IGNFAPP_PRELAUNCH_WAIT_LIST,
      ],
      isPrelaunchUser: true
    }


    this.store.dispatch(UserStoreActions.registerPrelaunchUserRequested({emailUserData}));

    this.postRegistrationActions();

  }

  private postRegistrationActions() {
    this.prelaunchUserSubscription = this.prelaunchUserData$
      .pipe(
        withLatestFrom(this.registrationProcessing$)
      )
      .subscribe(([userData, isProcessing]) => {
        if (!isProcessing && userData?.emailVerified) {
          console.log('User already registered!');
          this.userAlreadyRegistered = true;
        }
      })
  }

  // These getters are used for easy access in the HTML template
  get firstName() { return this.registerUserForm.get(UserRegistrationFormFieldKeys.FIRST_NAME) as AbstractControl; }
  get email() { return this.registerUserForm.get(UserRegistrationFormFieldKeys.EMAIL) as AbstractControl; }

}
