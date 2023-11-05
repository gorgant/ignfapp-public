import { Component, OnInit, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, withLatestFrom, map, switchMap, filter, catchError, throwError } from 'rxjs';
import { PersonalSessionFragment } from 'shared-models/train/personal-session-fragment.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { RootStoreState, PersonalSessionFragmentStoreSelectors, PersonalSessionFragmentStoreActions, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-train-dashboard',
  templateUrl: './train-dashboard.component.html',
  styleUrls: ['./train-dashboard.component.scss']
})
export class TrainDashboardComponent implements OnInit {

  trainingSessionCardHeight = 300;

  private userData$!: Observable<PublicUser>;

  allPersonalSessionFragmentsFetched$!: Observable<boolean>;
  personalSessionFragments$!: Observable<PersonalSessionFragment[]>;
  private fetchAllPersonalSessionFragmentsProcessing$!: Observable<boolean>;
  private fetchAllPersonalSessionFragmentsError$!: Observable<{} | null>;
  private $personalSessionFragmentsRequested = signal(false);

  private store$ = inject(Store<RootStoreState.AppState>);
  private uiService = inject(UiService);

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
            this.$personalSessionFragmentsRequested.set(false);
          }
          const personalSessionFragmentsInStore$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsInStore);
          return personalSessionFragmentsInStore$;
        }),
        withLatestFrom(this.fetchAllPersonalSessionFragmentsError$, this.userData$, this.allPersonalSessionFragmentsFetched$),
        filter(([personalSessionFragments, processingError, userData, allFetched]) => !processingError),
        map(([personalSessionFragments, processingError, userData, allFetched]) => {
          if (!allFetched && !this.$personalSessionFragmentsRequested()) {
            this.store$.dispatch(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsRequested({userId: userData.id}));
            this.$personalSessionFragmentsRequested.set(true);
          }
          return personalSessionFragments;
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.$personalSessionFragmentsRequested.set(false);
          return throwError(() => new Error(error));
        })
      );
  }

}
