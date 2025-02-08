import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, catchError, filter, map, switchMap, throwError, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { TrainingRecord, UiTrainingRecord } from 'shared-models/train/training-record.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { TrainingRecordStoreActions, TrainingRecordStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { DurationMsToMmSsPipe } from "../../../shared/pipes/duration-ms-to-mm-ss.pipe";
import { ProcessingSpinnerComponent } from "../../../shared/components/processing-spinner/processing-spinner.component";
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-training-history',
    templateUrl: './training-history.component.html',
    styleUrl: './training-history.component.scss',
    imports: [AsyncPipe, DurationMsToMmSsPipe, DatePipe, ProcessingSpinnerComponent, MatButtonModule]
})
export class TrainingHistoryComponent implements OnInit {

  NO_TRAINING_RECORDS_BLURB = GlobalFieldValues.NO_TRAINING_RECORDS;
  TRAINING_HISTORY_TITLE = GlobalFieldValues.TRAINING_HISTORY;
  TRAINING_RECORDS_TEXT = GlobalFieldValues.TRAINING_RECORDS;
  VIEW_MY_QUEUE_BUTTON_VALUE = GlobalFieldValues.VIEW_MY_QUEUE;
  
  private userData$!: Observable<PublicUser>;

  private $fetchTrainingRecordsSubmitted = signal(false);
  private allTrainingRecordsFetched$!: Observable<boolean>;
  private fetchAllTrainingRecordsError$!: Observable<{} | null>;
  fetchAllTrainingRecordsProcessing$!: Observable<boolean>;
  trainingRecords$!: Observable<UiTrainingRecord[]>;

  private store$ = inject(Store);
  private uiService = inject(UiService);
  private router = inject(Router);

  ngOnInit(): void {
    this.monitorProcesses();
    this.fetchAllTrainingRecords();
  }

  private monitorProcesses() {
    this.allTrainingRecordsFetched$ = this.store$.select(TrainingRecordStoreSelectors.selectAllTrainingRecordsFetched);  // We use this to determine if the initial empty array returned when the store is fetched is a pre-loaded state or the actual state
    this.fetchAllTrainingRecordsError$ = this.store$.select(TrainingRecordStoreSelectors.selectFetchAllTrainingRecordsError);
    this.fetchAllTrainingRecordsProcessing$ = this.store$.select(TrainingRecordStoreSelectors.selectFetchAllTrainingRecordsProcessing);
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;
  }

  private fetchAllTrainingRecords() {
    this.trainingRecords$ = this.fetchAllTrainingRecordsError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetComponentState();
          }
          const trainingRecordsInStore$ = this.store$.select(TrainingRecordStoreSelectors.selectAllTrainingRecordsInStore);
          return trainingRecordsInStore$;
        }),
        withLatestFrom(this.fetchAllTrainingRecordsError$, this.userData$, this.allTrainingRecordsFetched$),
        filter(([trainingRecords, processingError, userData, allFetched]) => !processingError),
        map(([trainingRecords, processingError, userData, allFetched]) => {
          if (!allFetched && !this.$fetchTrainingRecordsSubmitted()) {
            this.store$.dispatch(TrainingRecordStoreActions.fetchAllTrainingRecordsRequested({userId: userData.id}));
            this.$fetchTrainingRecordsSubmitted.set(true);
          }
          return trainingRecords as UiTrainingRecord[];
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
    this.$fetchTrainingRecordsSubmitted.set(false);
    // Don't purge error state here, otherwise we get an infinite loop because async pipe in template auto-subscribes! Instead, do onDestroy
  }

  onNavigateToTrain() {
    this.router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
  }

  onSelectTrainingRecord(trainingRecordId: string) {
    this.router.navigate([PublicAppRoutes.ACCOUNT_TRAINING_RECORD, trainingRecordId]);
  }

}
