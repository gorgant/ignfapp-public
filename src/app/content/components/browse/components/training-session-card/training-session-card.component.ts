import { Component, Input, OnInit } from '@angular/core';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingSession } from 'shared-models/train/training-session.model';

@Component({
  selector: 'app-training-session-card',
  templateUrl: './training-session-card.component.html',
  styleUrls: ['./training-session-card.component.scss']
})
export class TrainingSessionCardComponent implements OnInit {

  @Input() trainingSesssionData!: TrainingSession; 

  COMPLEXITY_SUBTEXT = GlobalFieldValues.COMPLEXITY;
  INTENSITY_SUBTEXT = GlobalFieldValues.INTENSITY;

  constructor() { }

  ngOnInit(): void {
  }

}
