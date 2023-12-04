import { CallableOptions, CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";
import { DeleteTrainingPlanData } from "../../../shared-models/train/delete-training-plan-data.model";
import { logger } from "firebase-functions/v2";
import { TrainingPlan, TrainingPlanKeys, TrainingPlanVisibilityCategoryDbOption } from "../../../shared-models/train/training-plan.model";
import { publicFirestore } from "../config/db-config";
import { PublicCollectionPaths } from "../../../shared-models/routes-and-paths/fb-collection-paths.model";


const deleteTrainingPlan = async (trainingPlan: TrainingPlan, userId: string) => {
  const trainingPlanId = trainingPlan[TrainingPlanKeys.ID];
  const visibilityCategory = trainingPlan[TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY];
  const isPublicTrainingPlan = visibilityCategory === TrainingPlanVisibilityCategoryDbOption.PUBLIC;

  let trainingPlanDocReference: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>

  if (isPublicTrainingPlan) {
    trainingPlanDocReference = publicFirestore.collection(PublicCollectionPaths.PUBLIC_TRAINING_PLANS).doc(trainingPlanId);
  } else {
    trainingPlanDocReference = publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS).doc(userId).collection(PublicCollectionPaths.PRIVATE_TRAINING_PLANS).doc(trainingPlanId);
  }

  await publicFirestore.recursiveDelete(trainingPlanDocReference)
    .catch(err => {logger.log(`Failed to delete ${visibilityCategory} trainingPlan: `, err); throw new HttpsError('internal', err);});
  
  console.log(`Deleted ${visibilityCategory}trainingPlan with id ${trainingPlanId}`);

}


/////// DEPLOYABLE FUNCTIONS ///////

const callableOptions: CallableOptions = {
  enforceAppCheck: true
};

export const onCallDeleteTrainingPlan = onCall(callableOptions, async (request: CallableRequest<DeleteTrainingPlanData>): Promise<void> => {

  const deleteTrainingPlanData = request.data;
  const trainingPlan = deleteTrainingPlanData.trainingPlan;
  const userId = deleteTrainingPlanData.userId;
  
  logger.log(`onCallDeleteTrainingPlan requested with this data ${deleteTrainingPlanData}`);
  
  return deleteTrainingPlan(trainingPlan, userId);
});