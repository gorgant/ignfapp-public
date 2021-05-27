import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmailUserData } from 'shared-models/email/email-user-data.model';
import { EmailSenderAddresses, SendgridContactListId } from 'shared-models/email/email-vars.model';
import { UserRegistrationFormFieldValues, UserRegistrationFormFieldKeys, UserRegistrationButtonValues } from 'shared-models/forms/user-registration-form-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { UserService } from 'src/app/core/services/user.service';

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

  userDataSubmitted: boolean = false;
  registrationProcessing: boolean = false;
  userAlreadyRegistered: boolean = false;

  trustedEmailSender = EmailSenderAddresses.IGNFAPP_DEFAULT;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private afs: AngularFirestore
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.registerUserForm = this.fb.group({
      [UserRegistrationFormFieldKeys.FIRST_NAME]: ['', [Validators.required]],
      [UserRegistrationFormFieldKeys.EMAIL]: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {

    this.registrationProcessing = true;

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

    this.userService.registerPrelaunchUser(emailUserData)
      .subscribe(registeredUser => {
        console.log('Received registered user to component');
        this.userDataSubmitted = true;
        this.registrationProcessing = false;
        if (registeredUser.emailVerified) {
          this.userAlreadyRegistered = true;
        }
      }, err => {
        console.log('Received error message to component', err);
        this.registrationProcessing = false;
      });
  }

  


  // These getters are used for easy access in the HTML template
  get firstName() { return this.registerUserForm.get(UserRegistrationFormFieldKeys.FIRST_NAME) as AbstractControl; }
  get email() { return this.registerUserForm.get(UserRegistrationFormFieldKeys.EMAIL) as AbstractControl; }

}
