import { logger } from 'firebase-functions/v2';
import { CallableOptions, CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { PubSub } from '@google-cloud/pubsub';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { TrainingSessionRating } from '../../../shared-models/train/session-rating.model';import { publicAppProjectId } from '../config/app-config';
const pubSub = new PubSub();

// Publish request to remove user from SG contact list
const publishUpdateRating = async(sessionRating: TrainingSessionRating) => {
  const topicName = PublicTopicNames.UPDATE_SESSION_RATING;
  const projectId = publicAppProjectId;
  const topic = pubSub.topic(`projects/${projectId}/topics/${topicName}`);
  const pubsubMsg: TrainingSessionRating = {
    ...sessionRating
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

export const onCallUpdateSessionRating = onCall(callableOptions, async (request: CallableRequest<TrainingSessionRating>): Promise<string> => {

  const sessionRating = request.data;
  
  logger.log(`Update rating with this data ${sessionRating}`);
  
  return publishUpdateRating(sessionRating);
});