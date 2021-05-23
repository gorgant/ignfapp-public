import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { EmailVerificationData } from 'shared-models/email/email-verification-data';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-email-verification',
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.scss']
})
export class EmailVerificationComponent implements OnInit {

  supportEmail = EmailSenderAddresses.IGNFAPP_SUPPORT;

  emailVerified$!: Observable<boolean>;
  verificationProcessing: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.verifyUserEmail();
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
      this.emailVerified$ = this.authService.verifyEmail(emailVerificationData)
        .pipe(
          take(1),
          map(emailVerificationOutcome => {
            this.verificationProcessing = false
            return emailVerificationOutcome
          })
        )

      // TODO: Remove service call above, instead dispatch store action and listen for result
      this.reactToEmailVerificationOutcome();
    }
  }

  private reactToEmailVerificationOutcome() {
    // TODO: inform the user of the verification outcome
  }

  ngOnDestroy() {

  }

}
