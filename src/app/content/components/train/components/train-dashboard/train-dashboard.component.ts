import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, withLatestFrom, map } from 'rxjs';
import { PersonalSessionFragment } from 'shared-models/train/personal-session-fragment.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { RootStoreState, PersonalSessionFragmentStoreSelectors, PersonalSessionFragmentStoreActions, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-train-dashboard',
  templateUrl: './train-dashboard.component.html',
  styleUrls: ['./train-dashboard.component.scss']
})
export class TrainDashboardComponent implements OnInit {

  trainingSessionCardHeight = 300;

  userData$!: Observable<PublicUser>;

  personalSessionFragmentData$!: Observable<PersonalSessionFragment[]>;
  fetchAllPersonalSessionFragmentsProcessing$!: Observable<boolean>;
  fetchAllPersonalSessionFragmentsError$!: Observable<{} | null>;
  personalSessionFragmentsRequested!: boolean;

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.loadPersonalSessionFragmentData();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;

    this.fetchAllPersonalSessionFragmentsProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchAllPersonalSessionFragmentsProcessing);
    this.fetchAllPersonalSessionFragmentsError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchAllPersonalSessionFragmentsError);
  }

  // TODO: This configuration doesn't show the personal fragments on the initial load (possibly due to userData$ subscription triggering before component loads)
  private loadPersonalSessionFragmentData() {
    // this.personalSessionFragmentData$ = this.fetchAllPersonalSessionFragmentsProcessing$
    //   .pipe(
    //     withLatestFrom(
    //       this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsInStore),
    //       this.fetchAllPersonalSessionFragmentsError$,
    //       this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsFetched),
    //       this.userData$
    //     ),
    //     map(([loadingPersonalSessionFragments, personalSessionFragments, loadError, allPersonalSessionFragmentsFetched, userData]) => {
    //       if (loadError) {
    //         console.log('Error loading personalSessionFragments in component', loadError);
    //         this.personalSessionFragmentsRequested = false;
    //       }
  
    //       // Check if sessions are loaded, if not fetch from server
    //       if (!loadingPersonalSessionFragments && !this.personalSessionFragmentsRequested && !allPersonalSessionFragmentsFetched) {
    //         this.store$.dispatch(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsRequested({userId: userData.id}));
    //         this.personalSessionFragmentsRequested = true;
    //       }
    //       return personalSessionFragments;
    //     })
    //   );

      this.personalSessionFragmentData$ = this.userData$
      .pipe(
        withLatestFrom(
          this.fetchAllPersonalSessionFragmentsProcessing$,
          this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsInStore),
          this.fetchAllPersonalSessionFragmentsError$,
          this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsFetched),
        ),
        map(([userData, loadingPersonalSessionFragments, personalSessionFragments, loadError, allPersonalSessionFragmentsFetched]) => {
          if (loadError) {
            console.log('Error loading personalSessionFragments in component', loadError);
            this.personalSessionFragmentsRequested = false;
          }
  
          // Check if sessions are loaded, if not fetch from server
          if (!loadingPersonalSessionFragments && !this.personalSessionFragmentsRequested && !allPersonalSessionFragmentsFetched && userData) {
            this.store$.dispatch(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsRequested({userId: userData.id}));
            this.personalSessionFragmentsRequested = true;
          }
          return personalSessionFragments;
        })
      );

      
  }

}
