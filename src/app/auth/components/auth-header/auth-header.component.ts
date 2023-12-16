import { Component, OnInit } from '@angular/core';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';

@Component({
    selector: 'app-auth-header',
    templateUrl: './auth-header.component.html',
    styleUrls: ['./auth-header.component.scss'],
    standalone: true
})
export class AuthHeaderComponent implements OnInit {

  AUTH_HEADER = GlobalFieldValues.AUTH_PERSONALIZED_WORKOUTS;

  constructor() { }

  ngOnInit(): void {
  }

}
