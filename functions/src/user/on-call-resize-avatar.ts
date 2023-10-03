import { logger } from 'firebase-functions/v2';
import { CallableOptions, CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { PubSub } from '@google-cloud/pubsub';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { AvatarImageMetaData } from '../../../shared-models/images/image-metadata.model';
import { publicAppProjectId } from '../config/app-config';
const pubSub = new PubSub();

// Publish request to remove user from SG contact list
const publishResizeAvatar = async(imageMetaData: AvatarImageMetaData) => {
  const topicName = PublicTopicNames.RESIZE_AVATAR_TOPIC;
  const projectId = publicAppProjectId;
  const topic = pubSub.topic(`projects/${projectId}/topics/${topicName}`);
  const pubsubMsg: AvatarImageMetaData = {
    ...imageMetaData
  };
  const bufferedMsg = Buffer.from(JSON.stringify(pubsubMsg));
  const publishedMsgId = await topic.publishMessage({data: bufferedMsg})
    .catch(err => {logger.log(`Failed to publish to topic "${topicName}" on project "${projectId}":`, err); throw new HttpsError('internal', err);});
  logger.log(`Publish to topic "${topicName}" on project "${projectId}" succeeded:`, publishedMsgId);

  return publishedMsgId;
}

/////// DEPLOYABLE FUNCTIONS ///////
const callableOptions: CallableOptions = {
  enforceAppCheck: true
};

export const onCallResizeAvatar = onCall(callableOptions, async (request: CallableRequest<AvatarImageMetaData>): Promise<string> => {
  const imageMetaData = request.data;  
  logger.log(`Resize avatar image for user with id ${imageMetaData.customMetadata.publicUserId}`);
  
  return publishResizeAvatar(imageMetaData);
});