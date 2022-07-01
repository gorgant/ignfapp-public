import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { TrainingSession, TrainingSessionKeys } from '../../../shared-models/train/training-session.model';
import { publicFirestore } from '../config/db-config';

export const findSessionByVideoId = async (videoId: string): Promise<TrainingSession | null> => {

  const trainingSessionCollectionPath: string = PublicCollectionPaths.TRAINING_SESSIONS;

  const matchingSessionQuerySnapshot = await publicFirestore.collection(trainingSessionCollectionPath).where(TrainingSessionKeys.VIDEO_ID, "==", videoId).get();

  const noMatchingSession = matchingSessionQuerySnapshot.empty;

  if (noMatchingSession) {
    return null;
  }

  const matchingTrainingSession = matchingSessionQuerySnapshot.docs[0].data() as TrainingSession;

  return matchingTrainingSession;
}