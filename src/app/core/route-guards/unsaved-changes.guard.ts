import { CanDeactivate } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActionConfData } from 'shared-models/forms/action-conf-data.model';
import { ActionConfirmDialogueComponent } from 'src/app/shared/components/action-confirm-dialogue/action-confirm-dialogue.component';
import { CanDeactivateData } from 'shared-models/utils/can-deactivate-data.model';

// Courtesy of https://stackoverflow.com/a/41187919/6572208

export interface ComponentCanDeactivate {
  canDeactivate: () => CanDeactivateData | Observable<CanDeactivateData>;
}

@Injectable({
  providedIn: 'root'
}) 
export class UnsavedChangesGuard implements CanDeactivate<ComponentCanDeactivate> {

  constructor(
    private dialog: MatDialog,
  ) { }

  // NOTE: this warning message will only be shown when navigating elsewhere within your angular app;
  // when navigating away from your angular app, the browser will show a generic warning message
  // see http://stackoverflow.com/a/42207299/7307355

  canDeactivate(component: ComponentCanDeactivate): boolean | Observable<boolean> {

    const canDeactivateData = component.canDeactivate() as CanDeactivateData;

    // If navigation is preauthorized (e.g., no changes to be discarded), proceed with navigation
    if (canDeactivateData.deactivationPermitted) {
      return true;
    }

    // Otherwise, prompt user to proceed or abort

    const dialogConfig = new MatDialogConfig();
    const deleteConfData: ActionConfData = canDeactivateData.warningMessage;

    dialogConfig.data = deleteConfData;

    const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);

    return dialogRef.afterClosed()
      .pipe(
        switchMap(userConfirmed => {
          return new Observable<boolean>(observer => {
            if (userConfirmed) {
              observer.next(true);
              observer.complete();
            } else {
              observer.next(false);
              observer.complete();
            }
          })
        })
      );
  }
}