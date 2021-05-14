import { currentEnvironmentType } from "./environments-config";
import { EnvironmentTypes, PRODUCTION_APPS, SANDBOX_APPS } from "../../../shared-models/environments/env-vars.model";
import { Storage } from '@google-cloud/storage';
import * as functions from 'firebase-functions';


// Access to public app requires admin service account to be added to public IAM
const getIgnfappAdminStorage = (): Storage => {
  let storageConstructor: Storage;

  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      storageConstructor = new Storage({
        projectId: PRODUCTION_APPS.ignfappAdminApp.projectId
      });
      break;
    case EnvironmentTypes.SANDBOX:
      storageConstructor = new Storage({
        projectId: SANDBOX_APPS.ignfappAdminApp.projectId
      });
      break;
    default:
      throw new functions.https.HttpsError('failed-precondition', `No environment type detected when creating storage object`);
  }
  return storageConstructor;
};
export const ignfappAdminStorage = getIgnfappAdminStorage();

// Access to public app requires admin service account to be added to public IAM
const getIgnfappPublicStorage = (): Storage => {
  let storageConstructor: Storage;

  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      storageConstructor = new Storage({
        projectId: PRODUCTION_APPS.ignfappPublicApp.projectId
      });
      break;
    case EnvironmentTypes.SANDBOX:
      storageConstructor = new Storage({
        projectId: SANDBOX_APPS.ignfappPublicApp.projectId
      });
      break;
    default:
      throw new functions.https.HttpsError('failed-precondition', `No environment type detected when creating storage object`);
  }
  return storageConstructor;
};
export const ignfappPublicStorage = getIgnfappPublicStorage();