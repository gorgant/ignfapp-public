import { HttpsOptions, onRequest } from "firebase-functions/v2/https";
import { EnvironmentTypes, SecretsManagerKeyNames } from "../../../shared-models/environments/env-vars.model";
import { cloudSchedulerServiceAccountSecret } from "../config/api-key-config";
import { ADMIN_EMAIL_USER_DATA, validateRequestToken } from "../config/global-helpers";
import { getCombinedOptInData } from "../email/on-call-calculate-opt-in-count";
import { OptInCountComparisonData } from "../../../shared-models/email/opt-in-count-comparison-data";
import { currentEnvironmentType } from "../config/environments-config";
import { logger } from "firebase-functions/v2";
import { EmailUserData } from "../../../shared-models/email/email-user-data.model";
import { EmailIdentifiers } from "../../../shared-models/email/email-vars.model";
import { EmailPubMessage } from "../../../shared-models/email/email-pub-message.model";
import { dispatchEmail } from "./helpers/dispatch-email";

const dispatchOptInMismatchEmail = async (optInCountComparisonData: OptInCountComparisonData) => {
  const emailUserData: EmailUserData = {
    ...ADMIN_EMAIL_USER_DATA
  };
  const emailIdentifier = EmailIdentifiers.AUTO_NOTICE_OPT_IN_MISMATCH;
  const emailPubMessage: EmailPubMessage = {
    emailIdentifier,
    emailUserData,
    optInCountComparisonData
  };
  await dispatchEmail(emailPubMessage);
}

// Only send mismatch warning if the environment type is production, since sandbox will never match SG records
const verifyOptInParity = async (optInCountComparisonData: OptInCountComparisonData) => {
  logger.log(`dbSgOptInParity analyzed with ${optInCountComparisonData.sgOptInCount} contacts on Sendgrid and ${optInCountComparisonData.databaseOptInCount} subs in the database.`)
  if (optInCountComparisonData.sgOptInCount !== optInCountComparisonData.databaseOptInCount) {
   await dispatchOptInMismatchEmail(optInCountComparisonData);
  }

  
}

const executeActions = async () => {
  const optInCountComparisonData = await getCombinedOptInData();
  await verifyOptInParity(optInCountComparisonData);
}

/////// DEPLOYABLE FUNCTIONS ///////

const httpOptions: HttpsOptions = {
  secrets: [
    SecretsManagerKeyNames.CLOUD_SCHEDULER_SERVICE_ACCOUNT_EMAIL,
    SecretsManagerKeyNames.SENDGRID,
  ]
};

export const onReqVerifyDbSgOptInParity = onRequest(httpOptions, async (req, res) => {
  logger.log(`onReqVerifyDbSgOptInParity requested`);

  if (currentEnvironmentType === EnvironmentTypes.SANDBOX) {
    logger.log(`Sandbox detected, terminating function`);
    res.status(200).send('onReqPublishScheduledPosts succeeded!');
    return;
  }

  const expectedAudience = cloudSchedulerServiceAccountSecret.value();
  
  const isValid = await validateRequestToken(req, res, expectedAudience);
  
  if (!isValid) {
    logger.log('Request verification failed, terminating function');
    return;
  }


  await executeActions();

  res.status(200).send('onReqPublishScheduledPosts succeeded!');

});