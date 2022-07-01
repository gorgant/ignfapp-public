import { CanDeactivate } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActionConfData } from 'shared-models/forms/action-conf-data.model';
import { ActionConfirmDialogueComponent } from 'src/app/shared/components/action-confirm-dialogue/action-confirm-dialogue.component';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';

// Courtesy of https://stackoverflow.com/a/41187919/6572208

export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

@Injectable({
  providedIn: 'root'
}) 
export class UnsavedChangesGuard implements CanDeactivate<ComponentCanDeactivate> {

  DISCARD_EDITS_TITLE_VALUE = GlobalFieldValues.DISCARD_EDITS_TITLE;
  DISCARD_EDITS_BODY_VALUE = GlobalFieldValues.DISCARD_EDITS_BODY;

  constructor(
    private dialog: MatDialog,
  ) { }

  // NOTE: this warning message will only be shown when navigating elsewhere within your angular app;
  // when navigating away from your angular app, the browser will show a generic warning message
  // see http://stackoverflow.com/a/42207299/7307355

  canDeactivate(component: ComponentCanDeactivate): boolean | Observable<boolean> {
    
    // If navigation is preauthorized (e.g., no changes to be discarded), proceed with navigation
    if (component.canDeactivate()) {
      return true;
    }

    // Otherwise, prompt user to proceed or abort

    const dialogConfig = new MatDialogConfig();
    const deleteConfData: ActionConfData = {
      title: this.DISCARD_EDITS_TITLE_VALUE,
      body: this.DISCARD_EDITS_BODY_VALUE
    };

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