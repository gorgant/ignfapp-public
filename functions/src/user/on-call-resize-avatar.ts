import * as functions from 'firebase-functions';
import { publicProjectId } from "../config/environments-config";
import { PubSub } from '@google-cloud/pubsub';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { AvatarImageMetaData } from '../../../shared-models/images/image-metadata.model';
const pubSub = new PubSub();

// Publish request to remove user from SG contact list
const publishResizeAvatar = async(imageMetaData: AvatarImageMetaData) => {
  const topicName = PublicTopicNames.RESIZE_AVATAR_TOPIC;
  const projectId = publicProjectId;
  const topic = pubSub.topic(`projects/${projectId}/topics/${topicName}`);
  const pubsubMsg: AvatarImageMetaData = {
    ...imageMetaData
  };
  const bufferedMsg = Buffer.from(JSON.stringify(pubsubMsg));
  const [publishedMsgId] = await topic.publishMessage({data: bufferedMsg})
    .catch(err => {functions.logger.log(`Failed to publish to topic "${topicName}" on project "${projectId}":`, err); throw new functions.https.HttpsError('internal', err);});
  functions.logger.log(`Publish to topic "${topicName}" on project "${projectId}" succeeded:`, publishedMsgId);

  return publishedMsgId;
}

/////// DEPLOYABLE FUNCTIONS ///////

export const onCallResizeAvatar = functions.https.onCall( async (imageMetaData: AvatarImageMetaData): Promise<string> => {

  functions.logger.log(`Resize avatar image for user with id ${imageMetaData.customMetadata.publicUserId}`);
  
  return publishResizeAvatar(imageMetaData);
});