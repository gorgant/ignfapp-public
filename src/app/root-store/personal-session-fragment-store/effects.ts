import { Injectable, inject } from "@angular/core";
import { FirebaseError } from "@angular/fire/app";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, concatMap, map, switchMap } from "rxjs/operators";
import { PersonalSessionFragmentService } from "src/app/core/services/personal-session-fragment.service";
import * as PersonalSessionFragmentStoreActions from './actions';

@Injectable()
export class PersonalSessionFragmentStoreEffects {

  private actions$ = inject(Actions);
  private personalSessionFragmentService = inject(PersonalSessionFragmentService);

  constructor() { }

  batchCreatePersonalSessionFragmentsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PersonalSessionFragmentStoreActions.batchCreatePersonalSessionFragmentsRequested),
      concatMap(action => 
        this.personalSessionFragmentService.batchCreatePersonalSessionFragments(action.userId, action.personalSessionFragmentsNoId).pipe(
          map(personalSessionFragments => {
            return PersonalSessionFragmentStoreActions.batchCreatePersonalSessionFragmentsCompleted({personalSessionFragments});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PersonalSessionFragmentStoreActions.batchCreatePersonalSessionFragmentsFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  batchDeletePersonalSessionFragmentsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PersonalSessionFragmentStoreActions.batchDeletePersonalSessionFragmentsRequested),
      concatMap(action => 
        this.personalSessionFragmentService.batchDeletePersonalSessionFragments(action.userId, action.personalSessionFragmentIds).pipe(
          map(personalSessionFragmentIds => {
            return PersonalSessionFragmentStoreActions.batchDeletePersonalSessionFragmentsCompleted({personalSessionFragmentIds});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PersonalSessionFragmentStoreActions.batchDeletePersonalSessionFragmentsFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  batchModifyPersonalSessionFragmentsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PersonalSessionFragmentStoreActions.batchModifyPersonalSessionFragmentsRequested),
      concatMap(action => 
        this.personalSessionFragmentService.batchModifyPersonalSessionFragments(action.userId, action.personalSessionFragmentUpdates).pipe(
          map(personalSessionFragmentUpdates => {
            return PersonalSessionFragmentStoreActions.batchModifyPersonalSessionFragmentsCompleted({personalSessionFragmentUpdates});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PersonalSessionFragmentStoreActions.batchModifyPersonalSessionFragmentsFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  createPersonalSessionFragmentEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PersonalSessionFragmentStoreActions.createPersonalSessionFragmentRequested),
      concatMap(action => 
        this.personalSessionFragmentService.createPersonalSessionFragment(action.userId, action.personalSessionFragmentNoId).pipe(
          map(personalSessionFragment => {
            return PersonalSessionFragmentStoreActions.createPersonalSessionFragmentCompleted({personalSessionFragment});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PersonalSessionFragmentStoreActions.createPersonalSessionFragmentFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  deletePersonalSessionFragmentEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PersonalSessionFragmentStoreActions.deletePersonalSessionFragmentRequested),
      concatMap(action => 
        this.personalSessionFragmentService.deletePersonalSessionFragment(action.userId, action.personalSessionFragmentId).pipe(
          map(personalSessionFragmentId => {
            return PersonalSessionFragmentStoreActions.deletePersonalSessionFragmentCompleted({personalSessionFragmentId});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PersonalSessionFragmentStoreActions.deletePersonalSessionFragmentFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchAllPersonalSessionFragmentsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsRequested),
      switchMap(action => 
        this.personalSessionFragmentService.fetchAllPersonalSessionFragments(action.userId).pipe(
          map(personalSessionFragments => {
            return PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsCompleted({personalSessionFragments});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchMultiplePersonalSessionFragmentsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PersonalSessionFragmentStoreActions.fetchMultiplePersonalSessionFragmentsRequested),
      switchMap(action => 
        this.personalSessionFragmentService.fetchMultiplePersonalSessionFragments(action.userId, action.queryParams).pipe(
          map(personalSessionFragments => {
            return PersonalSessionFragmentStoreActions.fetchMultiplePersonalSessionFragmentsCompleted({personalSessionFragments});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PersonalSessionFragmentStoreActions.fetchMultiplePersonalSessionFragmentsFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchSinglePersonalSessionFragmentEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PersonalSessionFragmentStoreActions.fetchSinglePersonalSessionFragmentRequested),
      switchMap(action => 
        this.personalSessionFragmentService.fetchSinglePersonalSessionFragment(action.userId, action.personalSessionFragmentId).pipe(
          map(personalSessionFragment => {
            return PersonalSessionFragmentStoreActions.fetchSinglePersonalSessionFragmentCompleted({personalSessionFragment});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PersonalSessionFragmentStoreActions.fetchSinglePersonalSessionFragmentFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  updatePersonalSessionFragmentEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PersonalSessionFragmentStoreActions.updatePersonalSessionFragmentRequested),
      concatMap(action => 
        this.personalSessionFragmentService.updatePersonalSessionFragment(action.userId, action.personalSessionFragmentUpdates).pipe(
          map(personalSessionFragmentUpdates => {
            return PersonalSessionFragmentStoreActions.updatePersonalSessionFragmentCompleted({personalSessionFragmentUpdates});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PersonalSessionFragmentStoreActions.updatePersonalSessionFragmentFailed({error: fbError}));
          })
        )
      ),
    ),
  );

}