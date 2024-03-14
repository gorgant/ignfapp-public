import { logger } from "firebase-functions/v2";
import { CallableOptions, CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";
import { PublicCollectionPaths } from "../../../shared-models/routes-and-paths/fb-collection-paths.model";
import { publicFirestore } from "../config/db-config";
import { PublicUserKeys } from "../../../shared-models/user/public-user.model";
import { getSgContactCount } from "./helpers/get-sg-contact-count";
import { OptInCountComparisonData } from "../../../shared-models/email/opt-in-count-comparison-data";
import { getSgGlobalSuppressionCount } from "./helpers/get-sg-global-suppression-count";

const getDbSubscriberCount = async () => {

  const publicUserCollectionPath = PublicCollectionPaths.PUBLIC_USERS;
  
  const publicUserOptInCollection = await publicFirestore.collection(publicUserCollectionPath)
    .where(`${PublicUserKeys.EMAIL_OPT_IN_CONFIRMED}`, '==', true)
    .get()
    .catch(err => {logger.log(`Error fetching subscriber collection from public database:`, err); throw new HttpsError('internal', err);});

  const publicUserOptInCount = publicUserOptInCollection.size;

  const publicUserOptOutCollection = await publicFirestore.collection(publicUserCollectionPath)
    .where(`${PublicUserKeys.EMAIL_OPT_IN_CONFIRMED}`, '==', false)
    .where(`${PublicUserKeys.EMAIL_OPT_OUT_TIMESTAMP}`, '!=', null)
    .get()
    .catch(err => {logger.log(`Error fetching unSubCollection from admin database:`, err); throw new HttpsError('internal', err);});

  const publicUserOptOutCount = publicUserOptOutCollection.size;
  
  return { publicUserOptInCount, publicUserOptOutCount };

}

// Also used by the chron job (see verifySubscriberCountMatch)
export const getCombinedOptInData = async (): Promise<OptInCountComparisonData> => {

  const { publicUserOptInCount, publicUserOptOutCount } = await getDbSubscriberCount();

  const sgOptInCount = await getSgContactCount();
  const sgOptOutCount = await getSgGlobalSuppressionCount();
  const sgNetOptIns = sgOptInCount - sgOptOutCount; // Use the netOptIns here because in SG the raw optIns includes global supressions whereas the database excludes global supressions (group suppressions are included in both SG and database counts)

  const combinedOptInData: OptInCountComparisonData = {
    databaseOptInCount: publicUserOptInCount,
    databaseOptOutCount: publicUserOptOutCount,
    sgOptInCount: sgNetOptIns,
    sgOptOutCount: sgOptOutCount,
  }

  logger.log('Fetched this combined optIn data', combinedOptInData);

  return combinedOptInData;
}

/////// DEPLOYABLE FUNCTIONS ///////
const callableOptions: CallableOptions = {
  enforceAppCheck: true
};

export const onCallCalculateOptInCount = onCall(callableOptions, async (request: CallableRequest<void>) => {
  const emptyData = request.data;
  logger.log('onCallCalculateOptInCount requested with this data:', emptyData);

  const subscriberData = await getCombinedOptInData();
 
  return subscriberData;
});