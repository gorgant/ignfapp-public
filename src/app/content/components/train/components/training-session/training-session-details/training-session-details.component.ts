import { AfterContentInit, AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatAccordion, MatExpansionPanel } from '@angular/material/expansion';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingSession } from 'shared-models/train/training-session.model';

@Component({
  selector: 'app-training-session-details',
  templateUrl: './training-session-details.component.html',
  styleUrls: ['./training-session-details.component.scss']
})
export class TrainingSessionDetailsComponent implements OnInit {

  @Input() trainingSessionData!: TrainingSession;
  @ViewChild('expansionPanel') expansionPanel!: MatExpansionPanel;

  TAGS_TITLE_VALUE = GlobalFieldValues.TAGS;
  
  constructor() { }

  ngOnInit(): void {
    
  }
 
}
