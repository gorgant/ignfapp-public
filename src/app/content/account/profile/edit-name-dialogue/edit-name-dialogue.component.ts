import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription, catchError, combineLatest, filter, map, switchMap, tap, throwError, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UserProfileFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from 'shared-models/user/user-update.model';
import { UiService } from 'src/app/core/services/ui.service';
import { RootStoreState, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProcessingSpinnerComponent } from 'src/app/shared/components/processing-spinner/processing-spinner.component';

@Component({
    selector: 'app-edit-name-dialogue',
    templateUrl: './edit-name-dialogue.component.html',
    styleUrls: ['./edit-name-dialogue.component.scss'],
    standalone: true,
    imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogClose, ProcessingSpinnerComponent, AsyncPipe]
})
export class EditNameDialogueComponent implements OnInit, OnDestroy {


  FORM_VALIDATION_MESSAGES = UserProfileFormValidationMessages;

  EDIT_NAME_TITLE_VALUE = GlobalFieldValues.EDIT_NAME;
  FIRST_NAME_FIELD_VALUE = GlobalFieldValues.FIRST_NAME;
  LAST_NAME_FIELD_VALUE = GlobalFieldValues.LAST_NAME;
  DISPLAY_NAME_FIELD_VALUE = GlobalFieldValues.DISPLAY_NAME;
  SAVE_BUTTON_VALUE = GlobalFieldValues.SAVE;
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;

  userUpdateProcessing$!: Observable<boolean>;
  private userUpdateError$!: Observable<{} | null>;
  private userUpdateSubscription!: Subscription;
  private $updateUserSubmitted = signal(false);
  private $updateUserCycleInit = signal(false);
  private $updateUserCycleComplete = signal(false);
  
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EditNameDialogueComponent>);
  private store$ = inject(Store<RootStoreState.AppState>);
  private userData: PublicUser = inject(MAT_DIALOG_DATA);
  private uiService = inject(UiService);

  nameForm = this.fb.group({
    [PublicUserKeys.FIRST_NAME]: ['', [Validators.required]],
    [PublicUserKeys.LAST_NAME]: [''],
    [PublicUserKeys.DISPLAY_NAME]: ['']
  });

  constructor() { }

  ngOnInit() {
    this.initForm();
    this.monitorUpdateRequests();
  }

  private initForm(): void {
    // Patch in existing data if it exists
    this.nameForm.patchValue({
      [PublicUserKeys.FIRST_NAME]: this.userData.firstName,
      [PublicUserKeys.LAST_NAME]: this.userData.lastName,
      [PublicUserKeys.DISPLAY_NAME]: this.userData.displayName,
    });
  }

  get firstNameErrorMessage() {
    let errorMessage = '';
    if (this.firstName.hasError('required')) {
      return errorMessage = 'You must enter a value';
    }
    return errorMessage;
  }

  private monitorUpdateRequests(): void {
    this.userUpdateProcessing$ = this.store$.select(UserStoreSelectors.selectUpdatePublicUserProcessing);
    this.userUpdateError$ = this.store$.select(UserStoreSelectors.selectUpdatePublicUserError);
  }

  onSubmit() {

    this.userUpdateSubscription = this.userUpdateError$ 
      .pipe(
        map(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating dialog', processingError);
            this.resetComponentState();
            this.dialogRef.close(false);
          }
          return processingError;
        }),
        filter(processingError => !processingError ), // Halts function if processingError detected
        switchMap(processingError => {
          if (!this.$updateUserSubmitted()) {
            this.$updateUserSubmitted.set(true);
            const userData: Partial<PublicUser> = {
              id: this.userData.id,
              firstName: this.firstName.value,
              lastName: this.lastName.value,
              displayName: this.displayName.value
            };
        
            const userUpdateData: UserUpdateData = {
              userData,
              updateType: UserUpdateType.BIO_UPDATE
            };
        
            this.store$.dispatch(UserStoreActions.updatePublicUserRequested({userUpdateData}));
          }
          return this.userUpdateProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(updateProcessing => {
          if (updateProcessing) {
            this.$updateUserCycleInit.set(true);
          }
          if (!updateProcessing && this.$updateUserCycleInit()) {
            console.log('updateUser successful, proceeding with pipe.');
            this.$updateUserCycleInit.set(false);
            this.$updateUserCycleComplete.set(true);
          }
        }),
        filter(updateProcessing => !updateProcessing && this.$updateUserCycleComplete()),
        tap(updateProcessing => {
          this.uiService.showSnackBar(`User details updated!`, 10000);
          this.resetComponentState();
          this.dialogRef.close(true);
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 10000);
          this.resetComponentState();
          this.dialogRef.close(false);
          return throwError(() => new Error(error));
        })
      ).subscribe()
  }

  private resetComponentState() {
    this.userUpdateSubscription?.unsubscribe();
    this.$updateUserSubmitted.set(false);
    this.$updateUserCycleInit.set(false);
    this.$updateUserCycleComplete.set(false);
    this.store$.dispatch(UserStoreActions.purgePublicUserErrors());
  }

  // These getters are used for easy access in the HTML template
  get firstName() { return this.nameForm.get(PublicUserKeys.FIRST_NAME) as AbstractControl; }
  get lastName() { return this.nameForm.get(PublicUserKeys.LAST_NAME) as AbstractControl; }
  get displayName() { return this.nameForm.get(PublicUserKeys.DISPLAY_NAME) as AbstractControl; }

  ngOnDestroy(): void {
    this.userUpdateSubscription?.unsubscribe();
  }

}
