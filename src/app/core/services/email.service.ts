import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { Observable, throwError } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(
    private fns: AngularFireFunctions,
  ) { }

  // sendSendgridTest(emailContent: string): Observable<string> {
  //   const sendgridHttpCall = this.fns.httpsCallable(PublicFunctionNames.ON_CALL_SEND_SENDGRID_TEST);

  //   return sendgridHttpCall(emailContent)
  //     .pipe(
  //       take(1),
  //       tap(response => console.log('Sendgrid test sent', response)),
  //       catchError(error => {
  //         console.log('Error with sendgrid test', error);
  //         return throwError(error);
  //       })
  //     );
  // }

}
