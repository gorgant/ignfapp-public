import { logger } from 'firebase-functions/v2';
import { HttpsError } from 'firebase-functions/v2/https';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { CanonicalTrainingSession, TrainingSessionKeys } from '../../../shared-models/train/training-session.model';
import { YoutubeVideoDataKeys } from '../../../shared-models/youtube/youtube-video-data.model';
import { publicFirestore } from '../config/db-config';

export const findSessionByVideoId = async (videoId: string): Promise<CanonicalTrainingSession | null> => {

  const trainingSessionCollectionPath: string = PublicCollectionPaths.PUBLIC_TRAINING_SESSIONS;

  const matchingSessionQuerySnapshot = await publicFirestore.collection(trainingSessionCollectionPath).where(`${TrainingSessionKeys.VIDEO_DATA}.${YoutubeVideoDataKeys.ID}`, "==", videoId).get()
    .catch(err => {logger.log(`Failed to query db for session with video id ${videoId}`, err); throw new HttpsError('internal', err);});;

  const noMatchingSession = matchingSessionQuerySnapshot.empty;

  if (noMatchingSession) {
    return null;
  }

  const matchingTrainingSession = matchingSessionQuerySnapshot.docs[0].data() as CanonicalTrainingSession;

  return matchingTrainingSession;
}