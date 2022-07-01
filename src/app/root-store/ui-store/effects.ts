import { Injectable } from "@angular/core";
import { FirebaseError } from "@angular/fire/app";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { HelperService } from "src/app/core/services/helpers.service";
import * as UiStoreActions from './actions';

@Injectable()
export class UiStoreEffects {

  constructor(
    private actions$: Actions,
    private helperService: HelperService,
  ) { }

  environmentTypeEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UiStoreActions.environmentTypeRequested),
      switchMap(action => 
        this.helperService.getEnvironmentType().pipe(
          map(environmentType => {
            return UiStoreActions.environmentTypeRetrieved({environmentType});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UiStoreActions.environmentTypeFailed({error: fbError}));
          })
        )
      )
    )
  );



}
