import { Component, Input } from '@angular/core';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { EMPTY_SPINNER_MESSAGE } from 'shared-models/user-interface/dialogue-box-default-config.model';

@Component({
  selector: 'app-processing-spinner',
  templateUrl: './processing-spinner.component.html',
  styleUrls: ['./processing-spinner.component.scss']
})
export class ProcessingSpinnerComponent {
  DEFAULT_SPINNER_MESSAGE = GlobalFieldValues.REQUEST_PROCESSING;
  EMPTY_MESSAGE = EMPTY_SPINNER_MESSAGE;

  @Input() spinnerMessage: string | undefined;
  @Input() spinnerDiameter = 96;
  @Input() spinnerMargin = '0 0 0 0';
}
