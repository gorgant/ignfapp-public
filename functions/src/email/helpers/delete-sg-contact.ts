import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { EmailUserData } from "../../../../shared-models/email/email-user-data.model";
import { PublicTopicNames } from "../../../../shared-models/routes-and-paths/fb-function-names.model";
import { PubSub } from '@google-cloud/pubsub';
import { publicAppProjectId } from '../../config/app-config';
const pubSub = new PubSub();

// Publish SG Contact Update
export const deleteSgContact = async(emailUserData: EmailUserData) => {
  const topicName = PublicTopicNames.DELETE_SG_CONTACT_TOPIC;
  const projectId = publicAppProjectId;
  const topic = pubSub.topic(`projects/${projectId}/topics/${topicName}`);
  const pubsubMsg: EmailUserData = {
    ...emailUserData
  };
  const bufferedMsg = Buffer.from(JSON.stringify(pubsubMsg));
  const publishedMsgId = await topic.publishMessage({data: bufferedMsg})
    .catch(err => {logger.log(`Failed to publish to topic "${topicName}" on project "${projectId}":`, err); throw new HttpsError('internal', err);});
  logger.log(`Publish to topic "${topicName}" on project "${projectId}" succeeded:`, publishedMsgId);

  return publishedMsgId;
}
