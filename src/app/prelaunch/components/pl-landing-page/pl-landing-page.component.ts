import { Component, OnInit } from '@angular/core';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';

@Component({
  selector: 'app-pl-landing-page',
  templateUrl: './pl-landing-page.component.html',
  styleUrls: ['./pl-landing-page.component.scss']
})
export class PlLandingPageComponent implements OnInit {

  leadStatement = GlobalFieldValues.LP_COMING_SOON;
  callToAction = GlobalFieldValues.LP_JOIN_WAITLIST;

  constructor() { }

  ngOnInit(): void {
  }

}
