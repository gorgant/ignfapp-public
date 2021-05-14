import * as functions from 'firebase-functions';
import { EnvironmentTypes, PRODUCTION_APPS, SANDBOX_APPS } from '../../../shared-models/environments/env-vars.model';

export const currentEnvironmentType = functions.config().environment.type;

const getAdminProjectId = (): string => {
  let projectId: string;

  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      projectId = PRODUCTION_APPS.ignfappAdminApp.projectId
      break;
    case EnvironmentTypes.SANDBOX:
      projectId = SANDBOX_APPS.ignfappAdminApp.projectId
      break;
    default:
      throw new functions.https.HttpsError('failed-precondition', `No environment type detected when getting admin project ID`);
  }
  return projectId;
}
export const adminProjectId = getAdminProjectId();

const getPublicProjectId = (): string => {
  let projectId: string;

  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      projectId = PRODUCTION_APPS.ignfappPublicApp.projectId;
      break;
    case EnvironmentTypes.SANDBOX:
      projectId = SANDBOX_APPS.ignfappPublicApp.projectId;
      break;
    default:
      throw new functions.https.HttpsError('failed-precondition', `No environment type detected when getting public project ID`);
  }
  return projectId;
}

export const publicProjectId = getPublicProjectId();

const getPublicAppUrl = (): string => {
  let appUrl: string;

  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      appUrl = PRODUCTION_APPS.ignfappPublicApp.websiteDomain;
      break;
    case EnvironmentTypes.SANDBOX:
      appUrl = SANDBOX_APPS.ignfappPublicApp.websiteDomain;
      break;
    default:
      throw new functions.https.HttpsError('failed-precondition', `No environment type detected when getting public project ID`);
  }
  return appUrl
}
export const publicAppUrl = getPublicAppUrl();
