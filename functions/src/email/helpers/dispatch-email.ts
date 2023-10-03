import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { EmailUserData } from "../../../../shared-models/email/email-user-data.model";
import { PublicTopicNames } from "../../../../shared-models/routes-and-paths/fb-function-names.model";
import { PubSub } from '@google-cloud/pubsub';
import { EmailIdentifiers } from '../../../../shared-models/email/email-vars.model';
import { EmailPubMessage } from '../../../../shared-models/email/email-pub-message.model';
import { publicAppProjectId } from '../../config/app-config';
const pubSub = new PubSub();

// Trigger email send
export const dispatchEmail = async(userData: EmailUserData, emailIdentifier: EmailIdentifiers) => {
  const topicName = PublicTopicNames.DISPATCH_EMAIL_TOPIC;
  const projectId = publicAppProjectId;
  const topic = pubSub.topic(`projects/${projectId}/topics/${topicName}`);
  const pubsubMsg: EmailPubMessage = {
    emailCategory: emailIdentifier,
    userData
  };
  const bufferedMsg = Buffer.from(JSON.stringify(pubsubMsg));
  const publishedMsgId = await topic.publishMessage({data: bufferedMsg})
    .catch(err => {logger.log(`Failed to publish to topic "${topicName}" on project "${projectId}":`, err); throw new HttpsError('internal', err);});
  logger.log(`Publish to topic "${topicName}" on project "${projectId}" succeeded:`, publishedMsgId);
  return publishedMsgId;
}