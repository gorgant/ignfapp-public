import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmailUserData } from 'shared-models/email/email-user-data.model';
import { EmailSenderAddresses, SendgridContactListIds } from 'shared-models/email/email-vars.model';
import { SubscribeFormFieldValues, SubscribeFormFieldKeys, SubscribeFormButtonValues } from 'shared-models/forms/subscribe-form.model';
import { SubscribeFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-pl-signup',
  templateUrl: './pl-signup.component.html',
  styleUrls: ['./pl-signup.component.scss']
})
export class PlSignupComponent implements OnInit {

  subscribeForm!: FormGroup;
  formFieldKeys = SubscribeFormFieldKeys;
  formValidationMessages = SubscribeFormValidationMessages;
  firstNameFieldValue = SubscribeFormFieldValues.FIRST_NAME;
  emailFieldValue = SubscribeFormFieldValues.EMAIL;
  submitButtonValue = SubscribeFormButtonValues.REQUEST_INVITE;

  userRegistered: boolean = false;
  registrationProcessing: boolean = false;

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
    this.subscribeForm = this.fb.group({
      [SubscribeFormFieldKeys.FIRST_NAME]: ['', [Validators.required]],
      [SubscribeFormFieldKeys.EMAIL]: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {

    this.registrationProcessing = true;

    console.log('Submitted these values', this.subscribeForm.value);

    const emailUserData: EmailUserData = {
      email: this.email.value,
      firstName: this.firstName.value,
      id: this.afs.createId(),
      emailSendgridContactListArray: [
        SendgridContactListIds.IGNFAPP_PRELAUNCH_WAIT_LIST,
      ],
      isPrelaunchUser: true
    }

    this.userService.registerPrelaunchUser(emailUserData)
      .subscribe(registeredUser => {
        console.log('Received registered user to component');
        this.userRegistered = true;
        this.registrationProcessing = false;
      }, err => {
        console.log('Received error message to component', err);
        this.registrationProcessing = false;
      });
  }

  


  // These getters are used for easy access in the HTML template
  get firstName() { return this.subscribeForm.get(SubscribeFormFieldKeys.FIRST_NAME) as AbstractControl; }
  get email() { return this.subscribeForm.get(SubscribeFormFieldKeys.EMAIL) as AbstractControl; }

}
