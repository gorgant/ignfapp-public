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

  // onRemoveUserFromSgContactLists() {

  //   const fakeUserData: EmailUserData = {
  //     id: 'kib2OZjlaM5HPVl5hdsV',
  //     email: 'root.gregory@gmail.com',
  //     isPrelaunchUser: true
  //   }

  //   const listsToUpdate: SendgridContactListId[] = [
  //     SendgridContactListId.IGNFAPP_HEALTH_AND_FITNESS_NEWSLETTER,
  //     SendgridContactListId.IGNFAPP_ONBOARDING_GUIDE,
  //     SendgridContactListId.IGNFAPP_FEATURES_AND_NEWS
  //   ]

  //   const removalData: SgContactListRemovalData = {
  //     emailUserData: fakeUserData,
  //     listsToUpdate
  //   }

  //   console.log('Requesting removal of this data from user and SG', removalData);

  //   this.userService.removeUserFromSgContactList(removalData)
  //     .pipe(
  //       take(1)
  //     )
  //     .subscribe(response => {
  //       console.log('Recieved removal response to component', response);
  //     })
  // }

}
