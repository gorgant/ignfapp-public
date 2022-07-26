import * as functions from 'firebase-functions';
import { publicProjectId } from "../config/environments-config";
import { PubSub } from '@google-cloud/pubsub';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { SessionRating } from '../../../shared-models/train/session-rating.model';;
const pubSub = new PubSub();

// Publish request to remove user from SG contact list
const publishUpdateRating = async(sessionRating: SessionRating) => {
  const topicName = PublicTopicNames.UPDATE_SESSION_RATING;
  const projectId = publicProjectId;
  const topic = pubSub.topic(`projects/${projectId}/topics/${topicName}`);
  const pubsubMsg: SessionRating = {
    ...sessionRating
  };
  const bufferedMsg = Buffer.from(JSON.stringify(pubsubMsg));
  const publishedMsgId = await topic.publishMessage({data: bufferedMsg})
    .catch(err => {functions.logger.log(`Failed to publish to topic "${topicName}" on project "${projectId}":`, err); throw new functions.https.HttpsError('internal', err);});
  functions.logger.log(`Publish to topic "${topicName}" on project "${projectId}" succeeded:`, publishedMsgId);

  return publishedMsgId;
}

/////// DEPLOYABLE FUNCTIONS ///////

export const onCallUpdateSessionRating = functions.https.onCall( async (sessionRating: SessionRating): Promise<string> => {

  functions.logger.log(`Update rating with this data ${sessionRating}`);
  
  return publishUpdateRating(sessionRating);
});