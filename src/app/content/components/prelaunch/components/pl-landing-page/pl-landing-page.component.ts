import { Component, OnInit } from '@angular/core';
import { PlLandingPageStrings } from 'shared-models/content/pl-signup-strings.model';

@Component({
  selector: 'app-pl-landing-page',
  templateUrl: './pl-landing-page.component.html',
  styleUrls: ['./pl-landing-page.component.scss']
})
export class PlLandingPageComponent implements OnInit {

  leadStatement = PlLandingPageStrings.LEAD_STATEMENT;
  callToAction = PlLandingPageStrings.CALL_TO_ACTION;

  constructor() { }

  ngOnInit(): void {
  }

}
