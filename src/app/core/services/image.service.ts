import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { Storage, StorageReference, ref, uploadBytesResumable, UploadTask, getDownloadURL, }  from '@angular/fire/storage';
import { catchError, from, map, Observable,of,take,throwError } from 'rxjs';
import { AvatarImageData } from 'shared-models/images/avatar-image-data.model';
import { AvatarImageMetaData } from 'shared-models/images/image-metadata.model';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  private storage = inject(Storage);
  private functions = inject(Functions);

  constructor() { }

  private async fetchDownloadUrl(storageRef: StorageReference, task?: UploadTask): Promise<string> {
    if (task) {
      await task;
      console.log(`File uploaded to this path`, storageRef.fullPath);
    }
    const url = await getDownloadURL(storageRef);
    return url;
  }

  resizeAvatarImage(imageMetaData: AvatarImageMetaData): Observable<string> {
    console.log('Submitting request to server to resize avatar');

    const resizeAvatarHttpCall: (data: AvatarImageMetaData) => Observable<string> = httpsCallableData(
      this.functions,
      PublicFunctionNames.ON_CALL_RESIZE_AVATAR
    );
    const res = resizeAvatarHttpCall(imageMetaData)
      .pipe(
        take(1),
        map(publishedMsgId => {
          console.log('Resize avatar published message ID:', publishedMsgId);
          if (!publishedMsgId) {
            throw new Error(`Error publishing resize avatar: ${publishedMsgId}`);
          }
          return publishedMsgId;
        }),
        catchError(error => {
          console.log('Error publishing resize avatar', error);
          return throwError(() => new Error(error));
        })
      );

    return res;
  }

  uploadAvatarImageAndGetDownloadUrl(avatarData: AvatarImageData): Observable<string> {

    const filePath = avatarData.imageMetadata.customMetadata.filePath;
    const storageBucket = avatarData.imageMetadata.customMetadata.storageBucket;
    const pathWithBucket = `${storageBucket}/${filePath}`;
    const storageRef = ref(this.storage,pathWithBucket);
    const task = uploadBytesResumable(storageRef, avatarData.file, avatarData.imageMetadata);

    return from(this.fetchDownloadUrl(storageRef, task))
      .pipe(
        map(downloadUrl => {
          console.log(`Fetched download url`, downloadUrl);
          return downloadUrl;
        }),
        catchError(error => {
          console.log('Error fetching download url', error);
          return throwError(() => new Error(error));
        })
      );
  }

}
