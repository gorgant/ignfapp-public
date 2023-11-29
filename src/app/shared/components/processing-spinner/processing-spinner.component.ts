import { Component, Input } from '@angular/core';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';

@Component({
  selector: 'app-processing-spinner',
  templateUrl: './processing-spinner.component.html',
  styleUrls: ['./processing-spinner.component.scss']
})
export class ProcessingSpinnerComponent {
  @Input() spinnerMessage: string = GlobalFieldValues.REQUEST_PROCESSING;
}
