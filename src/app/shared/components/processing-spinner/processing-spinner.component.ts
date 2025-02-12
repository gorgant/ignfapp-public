import { Component, input, Input } from '@angular/core';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { EMPTY_SPINNER_MESSAGE } from 'shared-models/user-interface/dialogue-box-default-config.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-processing-spinner',
    templateUrl: './processing-spinner.component.html',
    styleUrls: ['./processing-spinner.component.scss'],
    imports: [MatProgressSpinnerModule]
})
export class ProcessingSpinnerComponent {
  DEFAULT_SPINNER_MESSAGE = GlobalFieldValues.REQUEST_PROCESSING;
  EMPTY_MESSAGE = EMPTY_SPINNER_MESSAGE;

  $spinnerMessage = input<string>();
  $spinnerDiameter = input<number>(96);
  $spinnerMargin = input<string>('0 0 0 0');
}
