import * as functions from 'firebase-functions';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { AvatarImageMetaData } from '../../../shared-models/images/image-metadata.model';
import * as fs from 'fs-extra'; // Mirrors the existing filesystem methods, but uses Promises
import { basename, dirname, join } from 'path';
import { tmpdir } from 'os';
import * as sharp from 'sharp';
import { PublicCSDirectoryPaths } from '../../../shared-models/routes-and-paths/cs-directory-paths.model'
import { ignfappPublicStorage } from '../config/storage-config';
import { currentEnvironmentType } from '../config/environments-config';
import { EnvironmentTypes, ProductionCloudStorage, SandboxCloudStorage } from '../../../shared-models/environments/env-vars.model';
import { publicFirestore } from '../config/db-config';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { PublicUser } from '../../../shared-models/user/public-user.model';
import { Timestamp } from '@google-cloud/firestore';;

const publicStorage = ignfappPublicStorage;
const publicUsersBucket = currentEnvironmentType === EnvironmentTypes.PRODUCTION ? 
  publicStorage.bucket(ProductionCloudStorage.IGNFAPP_PUBLIC_USERS_STORAGE) :
  publicStorage.bucket(SandboxCloudStorage.IGNFAPP_PUBLIC_USERS_STORAGE);

// Exit if file is not an image.
const objectIsValidCheck = (imageMetaData: AvatarImageMetaData): boolean => {
  if (!imageMetaData.contentType || !imageMetaData.contentType.includes('image')) {
    functions.logger.log('Object is not an image.');
    return false;
  }
  return true
}

const resizeImage = async (imageMetaData: AvatarImageMetaData) => {
  
  const filePath = imageMetaData.customMetadata.filePath;
  const fileName = basename(filePath);
  const fileNameNoExt = imageMetaData.customMetadata.fileNameNoExt;
  const fileExt = imageMetaData.customMetadata.fileExt;
  const userId = imageMetaData.customMetadata.publicUserId;
  const contentType = imageMetaData.contentType;

  const sourceDir = dirname(filePath);
  const workingDir = join(tmpdir(), userId, PublicCSDirectoryPaths.AVATAR);
  const tmpFilePath = join(workingDir, fileName);
  const resizedImageSize = 100;

  const existingMetadata = await publicUsersBucket.file(filePath).getMetadata();   // Extracts existing metadata
  functions.logger.log(`Fetched this existing metadata from cloud storage:`, existingMetadata);

  // 1. Ensure directory exists
  await fs.ensureDir(workingDir)
    .catch(err => {functions.logger.log(`Error ensuring directory exists:`, err); throw new functions.https.HttpsError('internal', err);});
    

  // 2. Download Source File
  await publicUsersBucket.file(filePath).download({
    destination: tmpFilePath
  })
    .catch(err => {functions.logger.log(`Error retrieving file at ${filePath}:`, err); throw new functions.https.HttpsError('internal', err);});
  functions.logger.log('Image downloaded locally to', tmpFilePath);

  // 3. Resize the image
  // Currently this is configured to REPLACE origin file, meaning only final output will exist

  const thumbName = `${fileNameNoExt}${PublicCSDirectoryPaths.RESIZED_AVATAR_FILENAME_PREFIX}${resizedImageSize}.${fileExt}`;
  const thumbPath = join(workingDir, thumbName);
  const destination = join(sourceDir, thumbName);
  const metadata = {
    ...existingMetadata, // This includes item id
    resizedImage: 'true'
  };

  functions.logger.log('Thumbnail to be saved at', destination)

  await sharp(tmpFilePath)
    .resize(resizedImageSize, null) // Null for height, autoscale to width
    .toFile(thumbPath)
    .catch(err => {functions.logger.log(`Error resizing source image:`, err); throw new functions.https.HttpsError('internal', err);});

  // Upload to GCS
  const response = await publicUsersBucket.upload(thumbPath, {
    destination: destination,
    contentType: contentType,
    metadata: {metadata: metadata},
  })
    .catch(err => {functions.logger.log(`Error uploading image data:`, err); throw new functions.https.HttpsError('internal', err);});

  // Make the file publicly accessible
  await response[0].makePublic();

  // Then fetch the download url
  const avatarDownloadUrl = response[0].publicUrl();


  
  // 4. Delete original image in source directory
  const deleteOriginalImage = publicUsersBucket.file(filePath).delete()
    .catch(err => {functions.logger.log(`Error deleting original image:`, err); throw new functions.https.HttpsError('internal', err);});
  functions.logger.log('Original file deleted', filePath);

  await deleteOriginalImage;

  // 5. Remove the tmp/thumbs from the filesystem
  await fs.remove(workingDir);

  return avatarDownloadUrl;
}

const updateUserAvatarUrl = async (imageMetaData: AvatarImageMetaData, downloadUrl: string) => {
  const publicUsersCollection = publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS);
  const userId = imageMetaData.customMetadata.publicUserId;
  const userUpdates: Partial<PublicUser> = {
    avatarUrl: downloadUrl,
    lastModifiedTimestamp: Timestamp.now() as any,
  };

  await publicUsersCollection.doc(userId).update(userUpdates)
    .catch(err => {functions.logger.log(`Failed to update publicUser with id ${userId} in public database:`, err); throw new functions.https.HttpsError('internal', err);});
}


const executeActions = async (imageMetaData: AvatarImageMetaData) => {
  
  const resizedAvatarDownloadUrl = await resizeImage(imageMetaData);
  
  await updateUserAvatarUrl(imageMetaData, resizedAvatarDownloadUrl);
}

/////// DEPLOYABLE FUNCTIONS ///////

// Listen for pubsub message
export const onPubResizeAvatar = functions.pubsub.topic(PublicTopicNames.RESIZE_AVATAR_TOPIC).onPublish( async (message, context) => {
  const imageMetaData = message.json as AvatarImageMetaData;
  functions.logger.log(`${PublicTopicNames.RESIZE_AVATAR_TOPIC} request received with this data:`, imageMetaData);
  functions.logger.log('Context from pubsub:', context);

  // Exit function if invalid object
  if(!objectIsValidCheck(imageMetaData)) {
    return;
  };

  await executeActions(imageMetaData);
});