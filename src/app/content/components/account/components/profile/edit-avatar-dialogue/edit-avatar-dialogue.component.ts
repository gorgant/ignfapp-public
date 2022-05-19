import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicImagePaths } from 'shared-models/routes-and-paths/image-paths.model';
import { PublicUser } from 'shared-models/user/public-user.model';

@Component({
  selector: 'app-edit-avatar-dialogue',
  templateUrl: './edit-avatar-dialogue.component.html',
  styleUrls: ['./edit-avatar-dialogue.component.scss']
})
export class EditAvatarDialogueComponent implements OnInit {

  DEFAULT_PROFILE_IMAGE = PublicImagePaths.DEFAULT_PROFILE_IMAGE_ICON;

  EDIT_AVATAR_TITLE_VALUE = GlobalFieldValues.EDIT_AVATAR;

  constructor(
    @Inject(MAT_DIALOG_DATA) public userData: PublicUser
  ) { }

  ngOnInit(): void {
  }

}
