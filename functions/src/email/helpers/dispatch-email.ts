import * as functions from 'firebase-functions';
import { EmailUserData } from "../../../../shared-models/email/email-user-data.model";
import { PublicTopicNames } from "../../../../shared-models/routes-and-paths/fb-function-names.model";
import { publicProjectId } from "../../config/environments-config";
import { PubSub } from '@google-cloud/pubsub';
import { EmailCategories } from '../../../../shared-models/email/email-vars.model';
import { EmailPubMessage } from '../../../../shared-models/email/email-pub-message.model';
const pubSub = new PubSub();

// Trigger email send
export const dispatchEmail = async(userData: EmailUserData, emailCategory: EmailCategories) => {
  const topicName = PublicTopicNames.DISPATCH_EMAIL_TOPIC;
  const projectId = publicProjectId;
  const topic = pubSub.topic(`projects/${projectId}/topics/${topicName}`);
  const pubsubMsg: EmailPubMessage = {
    emailCategory,
    userData
  }
  const topicPublishRes = await topic.publishJSON(pubsubMsg)
    .catch(err => {functions.logger.log(`Failed to publish to topic "${topicName}" on project "${projectId}":`, err); throw new functions.https.HttpsError('internal', err);});
  functions.logger.log(`Publish to topic "${topicName}" on project "${projectId}" succeeded:`, topicPublishRes);
}