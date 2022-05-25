import { UploadMetadata } from 'firebase/storage';
import { ImageType } from './image-type.model';

export interface AvatarImageMetaData extends UploadMetadata {
  contentType: File['type'];
  customMetadata: {
    fileExt: string;
    fileNameNoExt: string;
    filePath: string;
    imageType: ImageType;
    publicUserId: string;
    resizedImage: string;
    storageBucket: string;
  };
}