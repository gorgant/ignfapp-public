import { CallableOptions, CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { publicFirestore } from "../config/db-config";
import { PublicCollectionPaths } from "../../../shared-models/routes-and-paths/fb-collection-paths.model";
import { CanonicalTrainingSession, TrainingSessionKeys, TrainingSessionVisibilityCategoryDbOption } from "../../../shared-models/train/training-session.model";
import { DeleteTrainingSessionData } from "../../../shared-models/train/delete-training-session-data.model";



const deleteTrainingSession = async (trainingSession: CanonicalTrainingSession, userId: string) => {
  const trainingSessionId = trainingSession[TrainingSessionKeys.ID];
  const visibilityCategory = trainingSession[TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY];
  const isPublicTrainingSession = visibilityCategory === TrainingSessionVisibilityCategoryDbOption.PUBLIC;

  let trainingSessionDocReference: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>

  if (isPublicTrainingSession) {
    trainingSessionDocReference = publicFirestore.collection(PublicCollectionPaths.PUBLIC_TRAINING_SESSIONS).doc(trainingSessionId);
  } else {
    trainingSessionDocReference = publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS).doc(userId).collection(PublicCollectionPaths.PRIVATE_TRAINING_SESSIONS).doc(trainingSessionId);
  }

  await publicFirestore.recursiveDelete(trainingSessionDocReference)
    .catch(err => {logger.log(`Failed to delete ${visibilityCategory} trainingSession: `, err); throw new HttpsError('internal', err);});
  
  console.log(`Deleted ${visibilityCategory}trainingSession with id ${trainingSessionId}`);

}


/////// DEPLOYABLE FUNCTIONS ///////

const callableOptions: CallableOptions = {
  enforceAppCheck: true
};

export const onCallDeleteTrainingSession = onCall(callableOptions, async (request: CallableRequest<DeleteTrainingSessionData>): Promise<void> => {

  const deleteTrainingSessionData = request.data;
  logger.log(`onCallDeleteTrainingSession requested with this data ${deleteTrainingSessionData}`);
  
  const trainingSession = deleteTrainingSessionData.trainingSession;
  const userId = deleteTrainingSessionData.userId;
  
  
  return deleteTrainingSession(trainingSession, userId);
});