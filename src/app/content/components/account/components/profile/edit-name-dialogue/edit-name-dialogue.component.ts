import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest, tap } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UserProfileFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from 'shared-models/user/user-update.model';
import { RootStoreState, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-edit-name-dialogue',
  templateUrl: './edit-name-dialogue.component.html',
  styleUrls: ['./edit-name-dialogue.component.scss']
})
export class EditNameDialogueComponent implements OnInit, OnDestroy {


  FORM_VALIDATION_MESSAGES = UserProfileFormValidationMessages;

  TITLE_FIELD_VALUE = GlobalFieldValues.EDIT_NAME;
  FIRST_NAME_FIELD_VALUE = GlobalFieldValues.FIRST_NAME;
  LAST_NAME_FIELD_VALUE = GlobalFieldValues.LAST_NAME;
  DISPLAY_NAME_FIELD_VALUE = GlobalFieldValues.DISPLAY_NAME;
  SAVE_BUTTON_VALUE = GlobalFieldValues.SAVE;
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;

  userUpdateProcessing$!: Observable<boolean>;
  private userUpdateError$!: Observable<{} | null>;
  private userUpdateSubscription!: Subscription;
  private updateSubmitted!: boolean;
  
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EditNameDialogueComponent>);
  private store$ = inject(Store<RootStoreState.AppState>);
  private userData: PublicUser = inject(MAT_DIALOG_DATA);

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

  private monitorUpdateRequests(): void {
    this.userUpdateProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectUpdatePublicUserProcessing));
    this.userUpdateError$ = this.store$.pipe(select(UserStoreSelectors.selectUpdatePublicUserError));
  }

  onSubmit() {

    const userData: Partial<PublicUser> = {
      id: this.userData.id,
      firstName: this.firstName.value,
      lastName: this.lastName.value,
      displayName: this.displayName.value
    }

    const userUpdateData: UserUpdateData = {
      userData,
      updateType: UserUpdateType.BIO_UPDATE
    };

    this.store$.dispatch(UserStoreActions.updatePublicUserRequested({userUpdateData}));
    this.postSubmitActions();
  }

  postSubmitActions() {
    this.userUpdateSubscription = combineLatest([this.userUpdateProcessing$, this.userUpdateError$]) 
      .pipe(
        tap(([updateProcessing, updateError]) => {
          if (updateProcessing) {
            this.updateSubmitted = true;
          }
  
          if (updateError) {
            console.log('Error updating name, resetting form');
            this.userUpdateSubscription.unsubscribe();
            this.updateSubmitted = false;
            return;
          }
          
          if (!updateProcessing && this.updateSubmitted) {
            console.log('User update succeeded, closing dialog');
            this.dialogRef.close(true);
          }
        })
      )
      .subscribe()
  }
  
  // These getters are used for easy access in the HTML template
  get firstName() { return this.nameForm.get(PublicUserKeys.FIRST_NAME) as AbstractControl; }
  get lastName() { return this.nameForm.get(PublicUserKeys.LAST_NAME) as AbstractControl; }
  get displayName() { return this.nameForm.get(PublicUserKeys.DISPLAY_NAME) as AbstractControl; }

  ngOnDestroy(): void {
    
    if (this.userUpdateSubscription) {
      this.userUpdateSubscription.unsubscribe();
    }
  }

}
