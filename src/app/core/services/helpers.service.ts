import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EnvironmentTypes } from 'shared-models/environments/env-vars.model';
import { SanitizedFileData } from 'shared-models/utils/sanitized-file-data.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { EmailUserData } from 'shared-models/email/email-user-data.model';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  private productionEnvironment: boolean = environment.production;

  constructor() { }

  getEnvironmentType(): Observable<EnvironmentTypes> {
    const envType = this.productionEnvironment ? EnvironmentTypes.PRODUCTION : EnvironmentTypes.SANDBOX;
    console.log('Environment Type: ', envType);
    return of(envType);
  }

  // Remove spaces from url string
  removeSpacesFromString(stringWithSpaces: string): string {
    return stringWithSpaces.replace(/\s/g, '');
  }

  // Replace spaces with dashes and set lower case
  convertToFriendlyUrlFormat(stringWithSpaces: string): string {
    return stringWithSpaces.split(' ').join('-').toLowerCase();
  }

  // Firebase can't handle back slashes
  createOrReverseFirebaseSafeUrl = (url: string, reverse?: boolean): string => {
    if (reverse) {
      const urlWithSlashes = url.replace(/~1/g, '/'); // Revert to normal url
      return urlWithSlashes;
    }
    const removedProtocol = url.split('//').pop() as string;
    const replacedSlashes = removedProtocol.replace(/\//g, '~1');
    return replacedSlashes;
  }

  /**
   * Rounds a number to the nearest digits desired
   * @param numb Number to round
   * @param digitsToRoundTo Number of digits desired
   */
  // Courtesy of: https://stackoverflow.com/questions/15762768/javascript-math-round-to-two-decimal-places
  generateRoundedNumber(numb: number, digitsToRoundTo: number) {
    let n = numb;
    let digits = digitsToRoundTo;
    let negative = false;
    if (digits === undefined) {
        digits = 0;
    }
    if ( n < 0) {
      negative = true;
      n = n * -1;
    }
    const multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    n = parseFloat((Math.round(n) / multiplicator).toFixed(2));
    if ( negative ) {
        n = parseFloat((n * -1).toFixed(2));
    }
    return n;
  }

  sanitizeFileName(file: File): SanitizedFileData {
    // https://stackoverflow.com/a/4250408/6572208 and https://stackoverflow.com/a/5963202/6572208
    const fileNameNoExt = file.name.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_');
    // https://stackoverflow.com/a/1203361/6572208
    const fileExt = file.name.split('.').pop() as string;
    const fullFileName = fileNameNoExt + '.' + fileExt;

    return {
      fileNameNoExt,
      fileExt,
      fullFileName
    };
  }

  convertPublicUserDataToEmailUserData(userData: PublicUser): EmailUserData {
    const emailUserData: EmailUserData = {
      createdTimestamp: userData[PublicUserKeys.CREATED_TIMESTAMP],
      email: userData[PublicUserKeys.EMAIL], 
      emailGroupUnsubscribes: userData[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES],
      emailGlobalUnsubscribe: userData[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE],
      emailLastSubSource: userData[PublicUserKeys.EMAIL_LAST_SUB_SOURCE],
      emailOptInConfirmed: userData[PublicUserKeys.EMAIL_OPT_IN_CONFIRMED],
      emailOptInTimestamp: userData[PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP], 
      emailSendgridContactId: userData[PublicUserKeys.EMAIL_SENDGRID_CONTACT_ID],
      emailSendgridContactListArray: userData[PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY],
      emailSendgridContactCreatedTimestamp: userData[PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP],
      emailVerified: userData[PublicUserKeys.EMAIL_VERIFIED],
      firstName: userData[PublicUserKeys.FIRST_NAME],
      id: userData[PublicUserKeys.ID],
      lastModifiedTimestamp: userData[PublicUserKeys.LAST_AUTHENTICATED_TIMESTAMP],
      lastName: userData[PublicUserKeys.LAST_NAME],
      onboardingWelcomeEmailSent: userData[PublicUserKeys.ONBOARDING_WELCOME_EMAIL_SENT],
    };
    return emailUserData;
  }

  // Avoid using this whenever possible, default to using the firebase API
  // generateFirestoreId(): string {
  //   const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  //   let autoId = ''
  //   for (let i = 0; i < 20; i++) {
  //     autoId += CHARS.charAt(
  //       Math.floor(Math.random() * CHARS.length)
  //     )
  //   }
  //   return autoId
  // }

}
