import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { EmailUserData } from 'shared-models/email/email-user-data.model';
import { SendgridContactListId } from 'shared-models/email/email-vars.model';
import { SgContactListRemovalData } from 'shared-models/email/sg-contact-list-removal-data';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(
    private userService: UserService
  ) { }

  ngOnInit(): void {
  }



}
