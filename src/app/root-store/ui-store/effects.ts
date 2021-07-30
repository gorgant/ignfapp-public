import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { UiService } from "src/app/core/services/ui.service";
import * as UiStoreActions from './actions';

@Injectable()
export class UiStoreEffects {

  constructor(
    private actions$: Actions,
    private uiService: UiService,
  ) { }

  environmentTypeEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UiStoreActions.environmentTypeRequested),
      switchMap(action => 
        this.uiService.getEnvironmentType().pipe(
          map(environmentType => {
            return UiStoreActions.environmentTypeRetrieved({environmentType});
          }),
          catchError(error => {
            const fbError: firebase.default.FirebaseError = {
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
