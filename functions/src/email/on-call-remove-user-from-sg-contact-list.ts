import * as functions from 'firebase-functions';
import { PublicTopicNames } from "../../../shared-models/routes-and-paths/fb-function-names.model";
import { SgContactListRemovalData } from "../../../shared-models/email/sg-contact-list-removal-data";
import { publicProjectId } from "../config/environments-config";
import { PubSub } from '@google-cloud/pubsub';
const pubSub = new PubSub();

// Publish request to remove user from SG contact list
const publishRemoveUserFromSgContactList = async(sgContactListRemovalData: SgContactListRemovalData) => {
  const topicName = PublicTopicNames.REMOVE_USER_FROM_SG_CONTACT_LIST;
  const projectId = publicProjectId;
  const topic = pubSub.topic(`projects/${projectId}/topics/${topicName}`);
  const pubsubMsg: SgContactListRemovalData = {
    ...sgContactListRemovalData
  }
  const topicPublishRes = await topic.publishJSON(pubsubMsg)
    .catch(err => {functions.logger.log(`Failed to publish to topic "${topicName}" on project "${projectId}":`, err); throw new functions.https.HttpsError('internal', err);});
  functions.logger.log(`Publish to topic "${topicName}" on project "${projectId}" succeeded:`, topicPublishRes);

  return topicPublishRes;
}

/////// DEPLOYABLE FUNCTIONS ///////

export const onCallRemoveUserFromSgContactList = functions.https.onCall( async (sgContactListRemovalData: SgContactListRemovalData): Promise<string> => {

  functions.logger.log(`Remove user ${sgContactListRemovalData.emailUserData.id} from these SG contact lists`, sgContactListRemovalData.listsToUpdate);
  
  return publishRemoveUserFromSgContactList(sgContactListRemovalData);
});