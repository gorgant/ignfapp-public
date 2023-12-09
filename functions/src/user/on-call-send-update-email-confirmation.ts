import { CallableOptions, CallableRequest, onCall } from "firebase-functions/v2/https";
import { EmailUserData } from "../../../shared-models/email/email-user-data.model";
import { logger } from "firebase-functions/v2";
import { dispatchEmail } from "../email/helpers/dispatch-email";
import { EmailIdentifiers } from "../../../shared-models/email/email-vars.model";
import { verifyAuthUidMatchesDocumentUserIdOrIsAdmin } from "../config/global-helpers";



/////// DEPLOYABLE FUNCTIONS ///////
const callableOptions: CallableOptions = {
  enforceAppCheck: true
};

export const onCallSendUpdateEmailConfirmation = onCall(callableOptions, async (request: CallableRequest<EmailUserData>): Promise<string> => {
  const userData = request.data;
  logger.log('onCallSendUpdateEmailConfirmation requested with this data', userData);

  const documentUserId = userData.id;
  await verifyAuthUidMatchesDocumentUserIdOrIsAdmin(request, documentUserId);

  const publishedMsgId = await dispatchEmail(userData, EmailIdentifiers.UPDATE_EMAIL_CONFIRMATION);
 
  return publishedMsgId;
});