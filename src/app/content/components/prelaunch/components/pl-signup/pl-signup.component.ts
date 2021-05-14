import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubscribeFormFieldValues, SubscribeFormFieldKeys, SubscribeFormButtonValues } from 'shared-models/forms/subscribe-form.model';
import { SubscribeFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PrelaunchUserFormData } from 'shared-models/user/prelaunch-user.model';
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


  constructor(
    private fb: FormBuilder,
    private userService: UserService
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

    console.log('Submitted these values', this.subscribeForm.value);

    const prelaunchUserFormData: PrelaunchUserFormData = {
      firstName: this.firstName.value,
      email: this.email.value
    }

    this.userService.registerPrelaunchUser(prelaunchUserFormData)
      .subscribe(registeredUser => {
        console.log('Received registered user to component');
      }, err => {
        console.log('Received error message to component', err);
      });
  }

  


  // These getters are used for easy access in the HTML template
  get firstName() { return this.subscribeForm.get(SubscribeFormFieldKeys.FIRST_NAME) as AbstractControl; }
  get email() { return this.subscribeForm.get(SubscribeFormFieldKeys.EMAIL) as AbstractControl; }

}
