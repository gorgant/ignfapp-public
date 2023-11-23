import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, withLatestFrom, map, switchMap, filter, catchError, throwError, take, tap } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PersonalSessionFragment } from 'shared-models/train/personal-session-fragment.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { RootStoreState, PersonalSessionFragmentStoreSelectors, PersonalSessionFragmentStoreActions, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-train-dashboard',
  templateUrl: './train-dashboard.component.html',
  styleUrls: ['./train-dashboard.component.scss']
})
export class TrainDashboardComponent implements OnInit, OnDestroy {

  BROWSE_TRAINING_PLANS_BUTTON_VALUE = GlobalFieldValues.BROWSE_TRAINING_PLANS;
  EDIT_MY_QUEUE = GlobalFieldValues.EDIT_MY_QUEUE;
  QUEUE_IS_EMPTY_BLURB = GlobalFieldValues.QUEUE_IS_EMPTY;

  trainingSessionCardHeight = 300;

  private userData$!: Observable<PublicUser>;

  private allPersonalSessionFragmentsFetched$!: Observable<boolean>;
  personalSessionFragments$!: Observable<PersonalSessionFragment[]>;
  fetchAllPersonalSessionFragmentsProcessing$!: Observable<boolean>;
  private fetchAllPersonalSessionFragmentsError$!: Observable<{} | null>;
  private $fetchPersonalSessionFragmentsSubmitted = signal(false);

  private store$ = inject(Store);
  private uiService = inject(UiService);
  private router = inject(Router);

  constructor() { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.fetchAllPersonalSessionFragments();
  }

  private monitorProcesses() {
    this.allPersonalSessionFragmentsFetched$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsFetched);  // We use this to determine if the initial empty array returned when the store is fetched is a pre-loaded state or the actual state
    this.fetchAllPersonalSessionFragmentsError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchAllPersonalSessionFragmentsError);
    this.fetchAllPersonalSessionFragmentsProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchAllPersonalSessionFragmentsProcessing);
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;
  }

  private fetchAllPersonalSessionFragments() {
    this.personalSessionFragments$ = this.fetchAllPersonalSessionFragmentsError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetComponentState();
          }
          const personalSessionFragmentsInStore$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsInStore);
          return personalSessionFragmentsInStore$;
        }),
        withLatestFrom(this.fetchAllPersonalSessionFragmentsError$, this.userData$, this.allPersonalSessionFragmentsFetched$),
        filter(([personalSessionFragments, processingError, userData, allFetched]) => !processingError),
        map(([personalSessionFragments, processingError, userData, allFetched]) => {
          if (!allFetched && !this.$fetchPersonalSessionFragmentsSubmitted()) {
            this.store$.dispatch(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsRequested({userId: userData.id}));
            this.$fetchPersonalSessionFragmentsSubmitted.set(true);
          }
          return personalSessionFragments;
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetComponentState();
          return throwError(() => new Error(error));
        })
      );
  }

  private resetComponentState() {
    this.$fetchPersonalSessionFragmentsSubmitted.set(false);
    // Don't purge error state here, otherwise we get an infinite loop because async pipe in template auto-subscribes! Instead, do onDestroy
  }

  onEditPersonalQueue() {
    this.router.navigate([PublicAppRoutes.TRAIN_EDIT_PERSONAL_QUEUE]);
  }

  onNavigateToBrowse() {
    this.router.navigate([PublicAppRoutes.BROWSE]);
  }

  ngOnDestroy(): void {
    this.fetchAllPersonalSessionFragmentsError$
      .pipe(
        take(1),
        tap(error => {
          if (error) {
            this.store$.dispatch(PersonalSessionFragmentStoreActions.purgePersonalSessionFragmentErrors());
          }
        })
      ).subscribe();
  }

}
