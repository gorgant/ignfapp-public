import { logger } from "firebase-functions/v2";
import { CallableOptions, CallableRequest, onCall } from "firebase-functions/v2/https";
import { EnvironmentTypes } from "../../../shared-models/environments/env-vars.model";
import { currentEnvironmentType } from "../config/environments-config";
import { projectID } from 'firebase-functions/params';
import { publicAppProjectId } from "../config/app-config";

/////// DEPLOYABLE FUNCTIONS ///////
const callableOptions: CallableOptions = {
  enforceAppCheck: true,
};

export const onCallTestFunction = onCall(callableOptions, async (request: CallableRequest<string>): Promise<EnvironmentTypes> => {
  logger.log('App check passed with these params', request.app?.appId);
  const data = request.data;
  logger.log('Received onCallTestFunction request with these params', data);
  logger.log('Project id in this function', projectID.value());
  logger.log('Project id from config', publicAppProjectId);
  logger.log('Environment type from config', currentEnvironmentType);
  return currentEnvironmentType;
});