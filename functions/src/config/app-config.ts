import { App, initializeApp } from "firebase-admin/app";
import { EnvironmentTypes, PRODUCTION_APPS, SANDBOX_APPS } from '../../../shared-models/environments/env-vars.model';
import { currentEnvironmentType } from './environments-config';
import { HttpsError } from 'firebase-functions/v2/https';

// Access to public app requires admin service account to be added to public IAM
const getIgnfappPublicApp = () => {
  let publicAppFirebaseInstance: App;
  let publicAppProjectId: string;
  let publicAppUrl: string;

  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      publicAppFirebaseInstance = initializeApp(
        PRODUCTION_APPS.ignfappPublicApp,
        'ignfappPublicApp'
      );
      publicAppProjectId = PRODUCTION_APPS.ignfappPublicApp.projectId;
      publicAppUrl = PRODUCTION_APPS.ignfappPublicApp.websiteDomain;
      break;
    case EnvironmentTypes.SANDBOX:
      publicAppFirebaseInstance = initializeApp(
        SANDBOX_APPS.ignfappPublicApp,
        'ignfappPublicApp'
      );
      publicAppProjectId = SANDBOX_APPS.ignfappPublicApp.projectId;
      publicAppUrl = SANDBOX_APPS.ignfappPublicApp.websiteDomain;
      break;
    default:
      throw new HttpsError('failed-precondition', `No environment type detected when creating public app`);
  }
  return {publicAppFirebaseInstance, publicAppProjectId, publicAppUrl};
};
export const {publicAppFirebaseInstance, publicAppProjectId, publicAppUrl} = getIgnfappPublicApp();
// export const publicAppProjectId = ignfappPublicApp.options.projectId;
// export const publicAppUrl = currentEnvironmentType === EnvironmentTypes.PRODUCTION ? 
//   PRODUCTION_APPS.ignfappPublicApp.websiteDomain : 
//   SANDBOX_APPS.ignfappPublicApp.websiteDomain;

