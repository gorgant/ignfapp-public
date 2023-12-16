import { Component, Input } from '@angular/core';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { EMPTY_SPINNER_MESSAGE } from 'shared-models/user-interface/dialogue-box-default-config.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-processing-spinner',
    templateUrl: './processing-spinner.component.html',
    styleUrls: ['./processing-spinner.component.scss'],
    standalone: true,
    imports: [MatProgressSpinnerModule]
})
export class ProcessingSpinnerComponent {
  DEFAULT_SPINNER_MESSAGE = GlobalFieldValues.REQUEST_PROCESSING;
  EMPTY_MESSAGE = EMPTY_SPINNER_MESSAGE;

  @Input() spinnerMessage: string | undefined;
  @Input() spinnerDiameter = 96;
  @Input() spinnerMargin = '0 0 0 0';
}
