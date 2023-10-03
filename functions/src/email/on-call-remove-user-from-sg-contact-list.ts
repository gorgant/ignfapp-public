import { CallableOptions, CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { PublicTopicNames } from "../../../shared-models/routes-and-paths/fb-function-names.model";
import { SgContactListRemovalData } from "../../../shared-models/email/sg-contact-list-removal-data";
import { PubSub } from '@google-cloud/pubsub';
import { publicAppProjectId } from '../config/app-config';
import { sendgridApiSecret } from '../config/api-key-config';
const pubSub = new PubSub();

// Publish request to remove user from SG contact list
const publishRemoveUserFromSgContactList = async(sgContactListRemovalData: SgContactListRemovalData) => {
  const topicName = PublicTopicNames.REMOVE_USER_FROM_SG_CONTACT_LIST_TOPIC;
  const projectId = publicAppProjectId;
  const topic = pubSub.topic(`projects/${projectId}/topics/${topicName}`);
  const pubsubMsg: SgContactListRemovalData = {
    ...sgContactListRemovalData
  };
  const bufferedMsg = Buffer.from(JSON.stringify(pubsubMsg));
  const publishedMsgId = await topic.publishMessage({data: bufferedMsg})
    .catch(err => {logger.log(`Failed to publish to topic "${topicName}" on project "${projectId}":`, err); throw new HttpsError('internal', err);});
  logger.log(`Publish to topic "${topicName}" on project "${projectId}" succeeded:`, publishedMsgId);

  return publishedMsgId;
}

/////// DEPLOYABLE FUNCTIONS ///////

const callableOptions: CallableOptions = {
  secrets: [sendgridApiSecret],
  enforceAppCheck: true
};

export const onCallRemoveUserFromSgContactList = onCall(callableOptions, async (request: CallableRequest<SgContactListRemovalData>): Promise<string> => {
  const sgContactListRemovalData = request.data;
  logger.log(`Remove user ${sgContactListRemovalData.emailUserData.id} from these SG contact lists`, sgContactListRemovalData.listsToUpdate);
  
  return publishRemoveUserFromSgContactList(sgContactListRemovalData);
});