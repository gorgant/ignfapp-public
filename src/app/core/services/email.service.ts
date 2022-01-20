import { Injectable } from '@angular/core';
import { Functions, httpsCallableData }  from '@angular/fire/functions';
import { Observable, throwError } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(
    private fns: Functions,
  ) { }

  // sendSendgridTest(emailContent: string): Observable<string> {
  //   const sendgridHttpCall = httpsCallableData(this.fns, PublicFunctionNames.ON_CALL_SEND_SENDGRID_TEST);

  //   return sendgridHttpCall(emailContent)
  //     .pipe(
  //       take(1),
  //       tap(response => console.log('Sendgrid test sent', response)),
  //       catchError(error => {
  //         console.log('Error with sendgrid test', error);
  //         return throwError(() => new Error(error));
  //       })
  //     );
  // }

}
