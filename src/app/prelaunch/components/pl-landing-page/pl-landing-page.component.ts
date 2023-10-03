import { Component, OnInit } from '@angular/core';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';

@Component({
  selector: 'app-pl-landing-page',
  templateUrl: './pl-landing-page.component.html',
  styleUrls: ['./pl-landing-page.component.scss']
})
export class PlLandingPageComponent implements OnInit {

  bodyStatement = GlobalFieldValues.LP_BODY;
  callToAction = GlobalFieldValues.LP_YOURE_ON_THE_WAITLIST;
  leadStatement = GlobalFieldValues.LP_COMING_SOON;


  constructor() { }

  ngOnInit(): void {
  }

}
