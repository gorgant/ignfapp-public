import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubscribeFormFieldValues, SubscribeFormFieldKeys, SubscribeFormButtonValues } from 'shared-models/forms/subscribe-form.model';
import { SubscribeFormValidationMessages } from 'shared-models/forms/validation-messages.model';

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
  }


  // These getters are used for easy access in the HTML template
  get firstName() { return this.subscribeForm.get(SubscribeFormFieldKeys.FIRST_NAME) as AbstractControl; }
  get email() { return this.subscribeForm.get(SubscribeFormFieldKeys.EMAIL) as AbstractControl; }

}
