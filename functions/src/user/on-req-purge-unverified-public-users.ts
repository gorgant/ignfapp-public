import { HttpsError, HttpsOptions, onRequest } from "firebase-functions/v2/https";
import { validateRequestToken } from "../config/global-helpers";
import { SecretsManagerKeyNames } from "../../../shared-models/environments/env-vars.model";
import { logger } from "firebase-functions/v2";
import { cloudSchedulerServiceAccountSecret } from "../config/api-key-config";
import { PublicCollectionPaths } from "../../../shared-models/routes-and-paths/fb-collection-paths.model";
import { publicFirestore } from "../config/db-config";
import { Timestamp } from '@google-cloud/firestore';
import { PublicUser, PublicUserKeys } from "../../../shared-models/user/public-user.model";
import { Response } from "express";

const purgeUnverifiedPublicUsers = async (res: Response) => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() - 30); // 30 days ago

  const publicUserCollectionRef = publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS);
  const unverifiedPublicUserCollectionSnapshot = await publicUserCollectionRef
    .where(`${PublicUserKeys.EMAIL_VERIFIED}`, '==', false)
    .where(`${PublicUserKeys.CREATED_TIMESTAMP}`, '<=', Timestamp.fromDate(expirationDate))
    .get()
    .catch(err => {logger.log(`Error fetching user from public database:`, err); throw new HttpsError('internal', err);});

  let writeBatch = publicFirestore.batch();
  let operationCount = 0;

  for (const publicUser of unverifiedPublicUserCollectionSnapshot.docs) {
    const publicUserRef = publicUserCollectionRef.doc(publicUser[PublicUserKeys.ID]);

    // This is a redundant safety check to ensure no verified users get deleted accidentally
    const publicUserData = publicUser.data() as PublicUser;
    if (publicUserData[PublicUserKeys.EMAIL_VERIFIED]) {
      const errMsg = `Attempted to delete a verified publicUser with id ${publicUserData[PublicUserKeys.ID]}! This should not happen. Confirm the query params.`;
      logger.log(errMsg);
      res.status(405).send();
      throw new HttpsError('aborted', errMsg);
    }

    writeBatch.delete(publicUserRef);
    operationCount++;

    if (operationCount === 490) {
      await writeBatch.commit()
        .catch(err => {logger.log(`Error writing batch to public database:`, err); throw new HttpsError('internal', err);});

      writeBatch = publicFirestore.batch();
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await writeBatch.commit()
      .catch(err => {logger.log(`Error writing batch to public database:`, err); throw new HttpsError('internal', err);});
  }

  if (unverifiedPublicUserCollectionSnapshot.size > 0) {
    logger.log(`Deleted ${(unverifiedPublicUserCollectionSnapshot).size} unverified publicUsers in public database`);
  } else {
    logger.log('No expired unverified publicUsers detected');
  }

}

/////// DEPLOYABLE FUNCTIONS ///////

const httpOptions: HttpsOptions = {
  secrets: [
    SecretsManagerKeyNames.CLOUD_SCHEDULER_SERVICE_ACCOUNT_EMAIL,
  ]
};

export const onReqPurgeUnverifiedPublicUsers = onRequest(httpOptions, async (req, res) => {

  logger.log('onReqPurgeUnverifiedPublicUsers detected with these headers', req.headers);

  const expectedAudience = cloudSchedulerServiceAccountSecret.value();
  
  const isValid = await validateRequestToken(req, res, expectedAudience);
  
  if (!isValid) {
    logger.log('Request verification failed, terminating function');
    return;
  }

  await purgeUnverifiedPublicUsers(res);

  res.status(200).send('onReqPurgeUnverifiedPublicUsers succeeded!');

});