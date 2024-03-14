import { CallableOptions, CallableRequest, onCall } from "firebase-functions/v2/https";
import { EmailUserData } from "../../../shared-models/email/email-user-data.model";
import { logger } from "firebase-functions/v2";
import { dispatchEmail } from "../email/helpers/dispatch-email";
import { EmailIdentifiers } from "../../../shared-models/email/email-vars.model";
import { verifyAuthUidMatchesDocumentUserIdOrIsAdmin } from "../config/global-helpers";
import { EmailPubMessage } from "../../../shared-models/email/email-pub-message.model";



/////// DEPLOYABLE FUNCTIONS ///////
const callableOptions: CallableOptions = {
  enforceAppCheck: true
};

export const onCallSendUpdateEmailConfirmation = onCall(callableOptions, async (request: CallableRequest<EmailUserData>): Promise<string> => {
  const emailUserData = request.data;
  logger.log('onCallSendUpdateEmailConfirmation requested with this data', emailUserData);

  const documentUserId = emailUserData.id;
  await verifyAuthUidMatchesDocumentUserIdOrIsAdmin(request, documentUserId);

  const emailIdentifier = EmailIdentifiers.UPDATE_EMAIL_CONFIRMATION;
  const emailPubMessage: EmailPubMessage = {
    emailIdentifier,
    emailUserData
  };

  const publishedMsgId = await dispatchEmail(emailPubMessage);
 
  return publishedMsgId;
});