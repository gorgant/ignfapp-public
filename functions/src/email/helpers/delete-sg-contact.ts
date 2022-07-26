import * as functions from 'firebase-functions';
import { EmailUserData } from "../../../../shared-models/email/email-user-data.model";
import { PublicTopicNames } from "../../../../shared-models/routes-and-paths/fb-function-names.model";
import { publicProjectId } from "../../config/environments-config";
import { PubSub } from '@google-cloud/pubsub';
const pubSub = new PubSub();

// Publish SG Contact Update
export const deleteSgContact = async(userData: EmailUserData) => {
  const topicName = PublicTopicNames.DELETE_SG_CONTACT_TOPIC;
  const projectId = publicProjectId;
  const topic = pubSub.topic(`projects/${projectId}/topics/${topicName}`);
  const pubsubMsg: EmailUserData = {
    ...userData
  }
  const bufferedMsg = Buffer.from(JSON.stringify(pubsubMsg));
  const publishedMsgId = await topic.publishMessage({data: bufferedMsg})
    .catch(err => {functions.logger.log(`Failed to publish to topic "${topicName}" on project "${projectId}":`, err); throw new functions.https.HttpsError('internal', err);});
  functions.logger.log(`Publish to topic "${topicName}" on project "${projectId}" succeeded:`, publishedMsgId);

  return publishedMsgId;
}
