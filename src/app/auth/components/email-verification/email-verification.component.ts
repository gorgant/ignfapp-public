import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { FirebaseError } from 'firebase/app';
import { Observable, combineLatest, map } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { EmailUpdateData } from 'shared-models/email/email-update-data.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { EmailVerificationData, EmailVerificationUrlParamKeys } from 'shared-models/email/email-verification-data';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { AuthStoreActions, AuthStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-email-verification',
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.scss']
})
export class EmailVerificationComponent implements OnInit {

  CONFIRMING_EMAIL_BLURB = GlobalFieldValues.EC_CONFIRMING_EMAIL;
  VERIFICATION_FAILED_BLURB = GlobalFieldValues.EC_VERIFICATION_FAILED;
  EMAIL_CONFIRMED_BLURB = GlobalFieldValues.EC_EMAIL_CONFIRMED;
  SUPPORT_EMAIL = EmailSenderAddresses.IGNFAPP_SUPPORT;

  verifyEmailSucceeded$!: Observable<boolean>;
  verifyEmailProcessing$!: Observable<boolean>;
  verifyEmailError$!: Observable<FirebaseError | Error | null>;

  updateEmailProcessing$!: Observable<boolean>;
  updateEmailError$!: Observable<FirebaseError | Error | null>;
  updateEmailSucceeded$!: Observable<boolean>;

  verificationOrUpdateProcessing$!: Observable<boolean>;
  verificationOrUpdateError$!: Observable<boolean>;
  verificationOrUpdateSucceeded$!: Observable<boolean>;

  dispatchedEmailVerificationRequest = false;

  private store$ = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() { }

  ngOnInit() {
    this.monitorStoreState();
    this.verifyUserEmail();
  }

  private monitorStoreState() {
    this.verifyEmailSucceeded$ = this.store$.select(AuthStoreSelectors.selectVerifyEmailSucceeded);
    this.verifyEmailProcessing$ = this.store$.select(AuthStoreSelectors.selectVerifyEmailProcessing);
    this.verifyEmailError$ = this.store$.select(AuthStoreSelectors.selectVerifyEmailError);

    this.updateEmailSucceeded$ = this.store$.select(AuthStoreSelectors.selectUpdateEmailSucceeded);
    this.updateEmailProcessing$ = this.store$.select(AuthStoreSelectors.selectUpdateEmailProcessing);
    this.updateEmailError$ = this.store$.select(AuthStoreSelectors.selectUpdateEmailError);

    this.verificationOrUpdateProcessing$ = combineLatest([
      this.verifyEmailProcessing$,
      this.updateEmailProcessing$,
    ])
      .pipe(
        map(([verifyingEmail, updatingEmail]) => {
          if (verifyingEmail || updatingEmail) {
            return true
          }
          return false
        })
      );

    this.verificationOrUpdateError$ = combineLatest([
      this.verifyEmailError$,
      this.updateEmailError$,
    ])
      .pipe(
        map(([verificationError, updateError]) => {
          if (verificationError || updateError) {
            return true
          }
          return false
        })
      );

    this.verificationOrUpdateSucceeded$ = combineLatest([
        this.verifyEmailSucceeded$,
        this.updateEmailSucceeded$,
      ])
        .pipe(
          map(([verificationSuccess, updateSuccess]) => {
            if (verificationSuccess || updateSuccess) {
              return true
            }
            return false
          })
        );
  }

  private verifyUserEmail() {
    console.log('Initiating user email verification process');
    
    // Check if id params are available
    const userIdParamKey = EmailVerificationUrlParamKeys.USER_ID;
    const emailParamKey = EmailVerificationUrlParamKeys.EMAIL;
    const isEmailUpdateParamKey = EmailVerificationUrlParamKeys.IS_EMAIL_UPDATE;

    const email: string = this.route.snapshot.queryParams[emailParamKey];
    const userId: string = this.route.snapshot.queryParams[userIdParamKey];
    const isEmailUpdate: boolean = this.route.snapshot.queryParams[isEmailUpdateParamKey];

    // Dispatch the corresponding action, either an update or an verification
    if (isEmailUpdate) {
      const emailUpdateData: EmailUpdateData = { userId, email, isEmailUpdate };
      console.log(`updating user ${userId} email to new email:`, emailUpdateData.email);
      this.store$.dispatch(AuthStoreActions.updateEmailRequested({emailUpdateData}));
      return;
    }

    if (!isEmailUpdate) {
      const emailVerificationData: EmailVerificationData = { userId, email };
      console.log(`verifying user ${userId} with email:`, emailVerificationData.email);
      this.store$.dispatch(AuthStoreActions.verifyEmailRequested({emailVerificationData}));
    }
  }

  onEnterApp() {
    this.router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
  }

  ngOnDestroy() {
  }

}
