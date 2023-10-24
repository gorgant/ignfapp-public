import { Component, Inject, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription, catchError, combineLatest, filter, switchMap, tap, throwError } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { AuthStoreActions, AuthStoreSelectors, RootStoreState, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-edit-password-dialogue',
  templateUrl: './edit-password-dialogue.component.html',
  styleUrls: ['./edit-password-dialogue.component.scss']
})
export class EditPasswordDialogueComponent implements OnInit, OnDestroy {

  TITLE_FIELD_VALUE = GlobalFieldValues.CHANGE_PASSWORD;
  CHANGE_PASSWORD_BLURB = GlobalFieldValues.CHANGE_PASSWORD_BLURB;
  SUBMIT_BUTTON_VALUE = GlobalFieldValues.SUBMIT;
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;

  resetPasswordProcessing$!: Observable<boolean>;
  private resetPasswordSubmitted = signal(false);
  private resetPasswordError$!: Observable<{} | null>;
  private resetPasswordSubscription!: Subscription;

  userData$!: Observable<PublicUser>;

  private dialogRef = inject(MatDialogRef<EditPasswordDialogueComponent>);
  private store$ = inject(Store<RootStoreState.AppState>);
  private uiService = inject(UiService);

  constructor() { }

  ngOnInit(): void {
    this.monitorResetRequests();
  }

  monitorResetRequests() {
    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectPublicUserData)) as Observable<PublicUser>;
    this.resetPasswordProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectResetPasswordProcessing));
    this.resetPasswordError$ = this.store$.pipe(select(AuthStoreSelectors.selectResetPasswordError));
  }

  onSubmit() {

    this.resetPasswordSubscription = this.resetPasswordError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating dialog', processingError);
            this.resetComponentActionState();
            this.dialogRef.close(false);
          }
          return combineLatest([this.userData$, this.resetPasswordError$]);
        }),
        filter(([userData, processingError]) => !processingError ), // Halts function if processingError detected
        switchMap(([userData, processingError]) => {
          const email = userData.email;
          this.store$.dispatch(AuthStoreActions.resetPasswordRequested({email}));
          this.resetPasswordSubmitted.set(true);
          return this.resetPasswordProcessing$;
        }),
        tap(resetProcessing => {
          if (!resetProcessing && this.resetPasswordSubmitted()) {
            console.log('resetPassword request submitted, closing dialogue box');
            this.dialogRef.close(true);
          }  
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetComponentActionState();
          this.dialogRef.close(false);
          return throwError(() => new Error(error));
        })
      )
      .subscribe();
  }

  private resetComponentActionState() {
    this.resetPasswordSubmitted.set(false);
  }

  ngOnDestroy(): void {
    this.resetPasswordSubscription?.unsubscribe();
  }

}
