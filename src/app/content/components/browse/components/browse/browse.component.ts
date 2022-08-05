import { Component, OnInit } from '@angular/core';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss']
})
export class BrowseComponent implements OnInit {

  PLANS_TAB_VALUE = GlobalFieldValues.PLANS;
  SESSIONS_TAB_VALUE = GlobalFieldValues.SESSIONS;

  constructor(
  ) { }

  ngOnInit(): void {
  }

}
