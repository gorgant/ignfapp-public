import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { EmailVerificationData } from 'shared-models/email/email-verification-data';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { AuthStoreActions, AuthStoreSelectors, RootStoreState } from 'src/app/root-store';

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

  emailVerified$!: Observable<boolean>;
  emailVerificationProcessing$!: Observable<boolean>;
  emailVerficationSubscription!: Subscription;
  dispatchedEmailVerificationRequest = false;

  constructor(
    private route: ActivatedRoute,
    private store$: Store<RootStoreState.AppState>,
    private router: Router,
  ) { }

  ngOnInit() {
    this.monitorStoreState();
    this.verifyUserEmail();
  }

  private monitorStoreState() {
    this.emailVerified$ = this.store$.pipe(select(AuthStoreSelectors.selectEmailVerified));
    this.emailVerificationProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectEmailVerificationProcessing));
  }

  private verifyUserEmail() {
    console.log('Initiating user email verification process');
    
    // Check if id params are available
    const userIdParamName = 'uId';
    const emailParamName = 'eId';
    const isPrelaunchUserParamName = 'isPl';


    const email: string = this.route.snapshot.params[emailParamName];
    const userId: string = this.route.snapshot.params[userIdParamName];
    const isPrelaunchUser: boolean = this.route.snapshot.params[isPrelaunchUserParamName] ? JSON.parse(this.route.snapshot.params[isPrelaunchUserParamName]) : false;
    let emailVerificationData: EmailVerificationData;

    // Generate the verification data based on user type
    if (email && userIdParamName) {
      if (isPrelaunchUser) {
        emailVerificationData = {
          userId,
          email,
          isPrelaunchUser
        };
      } else {
        emailVerificationData = {
          userId,
          email,
          isPrelaunchUser: false
        };
      }

      console.log('marking subscriber confirmed with this id data', emailVerificationData);
      this.store$.dispatch(AuthStoreActions.verifyEmailRequested({emailVerificationData}));
      
      this.postVerificationActions();
    }
  }

  private postVerificationActions() {
    this.emailVerficationSubscription = this.emailVerified$
      .pipe(
        withLatestFrom(this.emailVerificationProcessing$)
      )
      .subscribe(([emailVerified, isProcessing]) => {
        if (isProcessing) {
          this.dispatchedEmailVerificationRequest = true; // Prevents the error icon from popping prematurely
        }
      });
  }

  onEnterApp() {
    this.router.navigate([PublicAppRoutes.TRAIN]);
  }

  ngOnDestroy() {
    if (this.emailVerficationSubscription) {
      this.emailVerficationSubscription.unsubscribe();
    }
  }

}
