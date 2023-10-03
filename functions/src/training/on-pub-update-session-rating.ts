import { logger } from 'firebase-functions/v2';
import { HttpsError } from 'firebase-functions/v2/https';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { TrainingSessionRating } from '../../../shared-models/train/session-rating.model';
import { TrainingSession } from '../../../shared-models/train/training-session.model';
import { publicFirestore } from '../config/db-config';
import { Timestamp } from '@google-cloud/firestore';import { MessagePublishedData, PubSubOptions, onMessagePublished } from 'firebase-functions/v2/pubsub';
import { CloudEvent } from 'firebase-functions/v2';

const trainingSessionCollection = publicFirestore.collection(PublicCollectionPaths.TRAINING_SESSIONS);

// Store session rating in collection
const storeSessionRating = async (sessionRating: TrainingSessionRating) => {
  logger.log('Creating new sessionRating', sessionRating);
  const sessionRatingCollection = publicFirestore.collection(`${PublicCollectionPaths.TRAINING_SESSIONS}/${sessionRating.trainingSessionId}/${PublicCollectionPaths.SESSION_RATINGS}`);
  await sessionRatingCollection.doc(sessionRating.id).set(sessionRating)
    .catch(err => {logger.log(`Failed to create sessionRating in public database:`, err); throw new HttpsError('internal', err);});
}

// Update session average rating values
const updateTrainingSessionAverage = async (sessionRating: TrainingSessionRating) => {
  logger.log('Updating session rating average');
  const trainingSessionDoc = await trainingSessionCollection.doc(sessionRating.trainingSessionId).get()
    .catch(err => {logger.log(`Failed to fetch trainingSession in public database:`, err); throw new HttpsError('internal', err);});
  
  const trainingSessionData = trainingSessionDoc.data() as TrainingSession;

  // Calculate new complexity average
  const currentComplexityAverage = trainingSessionData.complexityAverage;
  const currentComplexityRatingCount = trainingSessionData.complexityRatingCount;
  const sumOfComplexityRatings = currentComplexityAverage * currentComplexityRatingCount;
  const newComplexityRatingCount = currentComplexityRatingCount + 1;
  const newComplexityAverage = (sumOfComplexityRatings + sessionRating.complexityRating) / newComplexityRatingCount;
  const roundedComplexityAverage = Math.round((newComplexityAverage + Number.EPSILON) * 100) / 100; // Courtesy of https://stackoverflow.com/a/11832950/6572208

  // Calculate new intensity average
  const currentIntensityAverage = trainingSessionData.intensityAverage;
  const currentIntensityRatingCount = trainingSessionData.intensityRatingCount;
  const sumOfIntensityRatings = currentIntensityAverage * currentIntensityRatingCount;
  const newIntensityRatingCount = currentIntensityRatingCount + 1;
  const newIntensityAverage = (sumOfIntensityRatings + sessionRating.intensityRating) / newIntensityRatingCount;
  const roundedIntensityAverage = Math.round((newIntensityAverage + Number.EPSILON) * 100) / 100; // Courtesy of https://stackoverflow.com/a/11832950/6572208

  // Transmit updates to database
  const updatedRatingData: Partial<TrainingSession> = {
    complexityAverage: roundedComplexityAverage,
    complexityRatingCount: newComplexityRatingCount,
    intensityAverage: roundedIntensityAverage,
    intensityRatingCount: newIntensityRatingCount,
    lastModifiedTimestamp: Timestamp.now() as any,
  };

  await trainingSessionCollection.doc(trainingSessionData.id).update(updatedRatingData)
    .catch(err => {logger.log(`Failed to update trainingSession averages in public database:`, err); throw new HttpsError('internal', err);});
  
}

const executeActions = async (sessionRating: TrainingSessionRating): Promise<void> => {
  await storeSessionRating(sessionRating);
  await updateTrainingSessionAverage(sessionRating);
}


/////// DEPLOYABLE FUNCTIONS ///////
const pubSubOptions: PubSubOptions = {
  topic: PublicTopicNames.UPDATE_SESSION_RATING,
};

// Listen for pubsub message
export const onPubUpdateSessionRating = onMessagePublished(pubSubOptions, async (event: CloudEvent<MessagePublishedData<TrainingSessionRating>>) => {
  const sessionRating = event.data.message.json;
  logger.log(`${PublicTopicNames.UPDATE_SESSION_RATING} request received with this data:`, sessionRating);

  await executeActions(sessionRating);
});