import { Component, OnInit } from '@angular/core';
import { collection, doc, Firestore } from '@angular/fire/firestore';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { EmailUserData } from 'shared-models/email/email-user-data.model';
import { EmailSenderAddresses, SendgridContactListId } from 'shared-models/email/email-vars.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { PrelaunchUser } from 'shared-models/user/prelaunch-user.model';
import { PublicUserKeys } from 'shared-models/user/public-user.model';
import { RootStoreState, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-pl-signup',
  templateUrl: './pl-signup.component.html',
  styleUrls: ['./pl-signup.component.scss']
})
export class PlSignupComponent implements OnInit {

  registerUserForm!: UntypedFormGroup;
  formValidationMessages = UserRegistrationFormValidationMessages;
  firstNameFieldValue = GlobalFieldValues.FIRST_NAME;
  emailFieldValue = GlobalFieldValues.EMAIL;
  submitButtonValue = GlobalFieldValues.REQUEST_INVITE;
  processingSubmissionValue = GlobalFieldValues.PROCESSING_SUBMISSION;
  checkInboxBlurb1 = GlobalFieldValues.CHECK_INBOX_1;
  checkInboxBlurb2 = GlobalFieldValues.CHECK_INBOX_2;
  checkInboxBlurb3 = GlobalFieldValues.CHECK_INBOX_3;
  checkSpamBlurb1 = GlobalFieldValues.CHECK_SPAM_1;
  checkSpamBlurb2 = GlobalFieldValues.CHECK_SPAM_2;
  alreadyRegisteredBlurb = GlobalFieldValues.LP_ALREADY_REGISTERED;

  trustedEmailSender = EmailSenderAddresses.IGNFAPP_DEFAULT;
  
  prelaunchUserData$!: Observable<PrelaunchUser>;
  registrationProcessing$!: Observable<boolean>;
  userAlreadyRegistered: boolean = false;
  prelaunchUserSubscription!: Subscription;

  constructor(
    private fb: UntypedFormBuilder,
    private afs: Firestore,
    private store: Store<RootStoreState.AppState>
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.monitorStoreContents();
  }

  private initForm(): void {
    this.registerUserForm = this.fb.group({
      [PublicUserKeys.FIRST_NAME]: ['', [Validators.required]],
      [PublicUserKeys.EMAIL]: ['', [Validators.required, Validators.email]]
    });
  }

  private monitorStoreContents() {
    this.prelaunchUserData$ = this.store.pipe(select(UserStoreSelectors.selectPrelaunchUserData)) as Observable<PrelaunchUser>;
    this.registrationProcessing$ = this.store.pipe(select(UserStoreSelectors.selectRegisterPrelaunchUserProcessing));
  }

  onSubmit(): void {

    console.log('Submitted these values', this.registerUserForm.value);

    const emailUserData: EmailUserData = {
      email: this.email.value,
      firstName: this.firstName.value,
      id: doc(collection(this.afs, PublicCollectionPaths.PRELAUNCH_USERS)).id,
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
  get firstName() { return this.registerUserForm.get(PublicUserKeys.FIRST_NAME) as AbstractControl; }
  get email() { return this.registerUserForm.get(PublicUserKeys.EMAIL) as AbstractControl; }

}
