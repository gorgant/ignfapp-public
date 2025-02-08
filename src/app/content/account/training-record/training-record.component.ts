import { Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription, catchError, filter, map, switchMap, tap, throwError, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { ActionConfData } from 'shared-models/forms/action-conf-data.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { TrainingRecord, TrainingRecordKeys, UiTrainingRecord } from 'shared-models/train/training-record.model';
import { DialogueBoxDefaultConfig } from 'shared-models/user-interface/dialogue-box-default-config.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { UserStoreSelectors, TrainingRecordStoreSelectors, TrainingRecordStoreActions } from 'src/app/root-store';
import { ActionConfirmDialogueComponent } from 'src/app/shared/components/action-confirm-dialogue/action-confirm-dialogue.component';
import { EditTrainingRecordDialogueComponent } from './edit-training-record-dialogue/edit-training-record-dialogue.component';
import { ProcessingSpinnerComponent } from "../../../shared/components/processing-spinner/processing-spinner.component";
import { TrainingSessionDetailsComponent } from "../../train/training-session/training-session-details/training-session-details.component";
import { MatIconModule } from '@angular/material/icon';
import { ActivityCategoryDbToUiPipe } from 'src/app/shared/pipes/activity-category-db-to-ui.pipe';
import { ComplexityDbToUiPipe } from 'src/app/shared/pipes/complexity-db-to-ui.pipe';
import { IntensityDbToUiPipe } from 'src/app/shared/pipes/intensity-db-to-ui.pipe';
import { MuscleGroupDbToUiPipe } from 'src/app/shared/pipes/muscle-group-db-to-ui.pipe';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { DurationMsToMmSsPipe } from 'src/app/shared/pipes/duration-ms-to-mm-ss.pipe';
import { AddTrainingSessionToPersonalQueueButtonComponent } from "../../../shared/components/add-training-session-to-personal-queue-button/add-training-session-to-personal-queue-button.component";

@Component({
    selector: 'app-training-record',
    templateUrl: './training-record.component.html',
    styleUrl: './training-record.component.scss',
    imports: [ProcessingSpinnerComponent, DurationMsToMmSsPipe, MatButtonModule, DatePipe, TrainingSessionDetailsComponent, MatIconModule, ActivityCategoryDbToUiPipe, MuscleGroupDbToUiPipe, ComplexityDbToUiPipe, IntensityDbToUiPipe, AddTrainingSessionToPersonalQueueButtonComponent]
})
export class TrainingRecordComponent implements OnInit {

  DELETE_TRAINING_RECORD_BUTTON_VALUE = GlobalFieldValues.DELETE_TRAINING_RECORD;
  DELETE_TRAINING_RECORD_CONF_BODY = GlobalFieldValues.DELETE_TRAINING_RECORD_CONF_BODY;
  DELETE_TRAINING_RECORD_CONF_TITLE = GlobalFieldValues.DELETE_TRAINING_RECORD_CONF_TITLE;
  EDIT_TRAINING_RECORD_BUTTON_VALUE = GlobalFieldValues.EDIT_TRAINING_RECORD;
  TAGS_TITLE_VALUE = GlobalFieldValues.TAGS;

  private userData$!: Observable<PublicUser>;

  $localTrainingRecord = signal(undefined as UiTrainingRecord | undefined);
  private $localTrainingRecordId = signal(undefined as string | undefined);

  private $fetchSingleTrainingRecordSubmitted = signal(false);
  private fetchTrainingRecordError$!: Observable<{} | null>;
  private fetchTrainingRecordProcessing$!: Observable<boolean>;
  private fetchTrainingRecordSubscription!: Subscription;

  private $deleteTrainingRecordSubmitted = signal(false);
  $deleteTrainingRecordCycleInit = signal(false);
  private $deleteTrainingRecordCycleComplete = signal(false);
  private deleteTrainingRecordSubscription!: Subscription;
  private deleteTrainingRecordProcessing$!: Observable<boolean>;
  private deleteTrainingRecordError$!: Observable<{} | null>;

  private uiService = inject(UiService);
  private store$ = inject(Store);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  ngOnInit(): void {
    this.monitorProcesses();
    this.setTrainingRecordData();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;
    
    this.fetchTrainingRecordProcessing$ = this.store$.select(TrainingRecordStoreSelectors.selectFetchSingleTrainingRecordProcessing);
    this.fetchTrainingRecordError$ = this.store$.select(TrainingRecordStoreSelectors.selectFetchSingleTrainingRecordError);

    this.deleteTrainingRecordProcessing$ = this.store$.select(TrainingRecordStoreSelectors.selectDeleteTrainingRecordProcessing);
    this.deleteTrainingRecordError$ = this.store$.select(TrainingRecordStoreSelectors.selectDeleteTrainingRecordError);
    
  }

  private setTrainingRecordId(): void {
    const trainingRecordId = this.route.snapshot.params[TrainingRecordKeys.ID];
    this.$localTrainingRecordId.set(trainingRecordId);
  }

  private setTrainingRecordData() {
    this.setTrainingRecordId();

    this.fetchTrainingRecordSubscription = this.fetchTrainingRecordError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetSetTrainingRecordComponentState();
            this.onNavigateToTrainingHistory();
          }
          return this.store$.select(TrainingRecordStoreSelectors.selectTrainingRecordById(this.$localTrainingRecordId()!)); 
        }),
        withLatestFrom(this.fetchTrainingRecordError$, this.userData$),
        filter(([trainingRecord, processingError, userData]) => !processingError && !this.$deleteTrainingRecordSubmitted()),
        map(([trainingRecord, processingError, userData]) => {
          if (!trainingRecord && !this.$fetchSingleTrainingRecordSubmitted()) {
            console.log(`trainingRecord ${this.$localTrainingRecordId()} not in store, fetching from database`);
            this.$fetchSingleTrainingRecordSubmitted.set(true);
            this.store$.dispatch(TrainingRecordStoreActions.fetchSingleTrainingRecordRequested({userId: userData.id, recordId: this.$localTrainingRecordId()!}));
          }
          return trainingRecord;
        }),
        filter(trainingRecord => !!trainingRecord),
        tap(trainingRecord => {
          console.log('Setting localTrainingRecord', trainingRecord);
          this.$localTrainingRecord.set(trainingRecord as UiTrainingRecord);
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 10000);
          this.resetSetTrainingRecordComponentState();
          this.onNavigateToTrainingHistory();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetSetTrainingRecordComponentState() {
    this.fetchTrainingRecordSubscription?.unsubscribe();
    this.$fetchSingleTrainingRecordSubmitted.set(false);
    this.store$.dispatch(TrainingRecordStoreActions.purgeTrainingRecordErrors());
  }

  onEditTrainingRecord() {
    const dialogConfig = {...DialogueBoxDefaultConfig};   
    dialogConfig.data = this.$localTrainingRecord();
    
    this.dialog.open(EditTrainingRecordDialogueComponent, dialogConfig);
  }

  onDeleteTrainingRecord() {
    const dialogConfig = {...DialogueBoxDefaultConfig};
    const actionConfData: ActionConfData = {
      title: this.DELETE_TRAINING_RECORD_CONF_TITLE,
      body: this.DELETE_TRAINING_RECORD_CONF_BODY,
    };

    dialogConfig.data = actionConfData;
    
    const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);
    const userConfirmedDelete$ = dialogRef.afterClosed() as Observable<boolean>;

    this.deleteTrainingRecordSubscription = this.deleteTrainingRecordError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetDeleteTrainingRecordComponentState();
          }
          return userConfirmedDelete$;
        }),
        withLatestFrom(this.deleteTrainingRecordError$, this.userData$),
        filter(([userConfirmedDelete, deleteError, userData]) => !deleteError && userConfirmedDelete),
        switchMap(([userConfirmedDelete, deletionError, userData]) => {
          if (!this.$deleteTrainingRecordSubmitted()) {
            this.$deleteTrainingRecordSubmitted.set(true);
            this.store$.dispatch(TrainingRecordStoreActions.deleteTrainingRecordRequested({
              userId: userData.id,
              recordId: this.$localTrainingRecordId()!,
            }));
          }
          return this.deleteTrainingRecordProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(deleteProcessing => {
          if (deleteProcessing) {
            this.$deleteTrainingRecordCycleInit.set(true);
          }
          if (!deleteProcessing && this.$deleteTrainingRecordCycleInit()) {
            console.log('deleteTrainingRecord successful, proceeding with pipe.');
            this.$deleteTrainingRecordCycleComplete.set(true);
            this.$deleteTrainingRecordCycleInit.set(false);
          }
        }),
        filter(deleteProcessing => !deleteProcessing && this.$deleteTrainingRecordCycleComplete()),
        tap(deletionProcessing => {
          this.uiService.showSnackBar(`Training Record deleted.`, 10000);
          this.onNavigateToTrainingHistory();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetDeleteTrainingRecordComponentState();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetDeleteTrainingRecordComponentState() {
    this.deleteTrainingRecordSubscription?.unsubscribe();
    this.$deleteTrainingRecordSubmitted.set(false);
    this.$deleteTrainingRecordCycleInit.set(false)
    this.$deleteTrainingRecordCycleComplete.set(false);
    this.store$.dispatch(TrainingRecordStoreActions.purgeTrainingRecordErrors());
  }

  onNavigateToTrainingHistory() {
    this.router.navigate([PublicAppRoutes.ACCOUNT_TRAINING_HISTORY]);
  }

}
