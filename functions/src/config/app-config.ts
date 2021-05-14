import * as admin from 'firebase-admin';
import { EnvironmentTypes, PRODUCTION_APPS, SANDBOX_APPS } from '../../../shared-models/environments/env-vars.model';
import { currentEnvironmentType } from './environments-config';
import * as functions from 'firebase-functions';


// Access to public app requires admin service account to be added to public IAM
const getIgnfappAdminApp = () => {
  let app: admin.app.App;

  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      app = admin.initializeApp(
        PRODUCTION_APPS.ignfappAdminApp,
        'ignfappAdminApp'
      );
      break;
    case EnvironmentTypes.SANDBOX:
      app = admin.initializeApp(
        SANDBOX_APPS.ignfappAdminApp,
        'ignfappAdminApp'
      );
      break;
    default:
      throw new functions.https.HttpsError('failed-precondition', `No environment type detected when creating admin app`);
  }
  return app;
};
export const ignfappAdminApp = getIgnfappAdminApp();

// Access to public app requires admin service account to be added to public IAM
const getIgnfappPublicApp = () => {
  let app: admin.app.App;

  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      app = admin.initializeApp(
        PRODUCTION_APPS.ignfappPublicApp,
        'ignfappPublicApp'
      );
      break;
    case EnvironmentTypes.SANDBOX:
      app = admin.initializeApp(
        SANDBOX_APPS.ignfappPublicApp,
        'ignfappPublicApp'
      );
      break;
    default:
      throw new functions.https.HttpsError('failed-precondition', `No environment type detected when creating public app`);
  }
  return app;
};
export const ignfappPublicApp = getIgnfappPublicApp();

const getAltEnvironmentIgnfappAdminApp = () => {

  let app: admin.app.App;

  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      app = admin.initializeApp(
        SANDBOX_APPS.ignfappAdminApp,
        'altIgnfappAdminApp'
      );
      break;
    case EnvironmentTypes.SANDBOX:
      app = admin.initializeApp(
        PRODUCTION_APPS.ignfappAdminApp,
        'altIgnfappAdminApp'
      );
      break;
    default:
      throw new functions.https.HttpsError('failed-precondition', `No environment type detected when creating alt admin app`);
  }
  return app;
}

export const altEnvironmentIgnfappAdminApp = getAltEnvironmentIgnfappAdminApp();

const getAltEnvironmentIgnfappPublicApp = () => {

  let app: admin.app.App;

  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      app = admin.initializeApp(
        SANDBOX_APPS.ignfappPublicApp,
        'altIgnfappPublicApp'
      );
      break;
    case EnvironmentTypes.SANDBOX:
      app = admin.initializeApp(
        PRODUCTION_APPS.ignfappPublicApp,
        'altIgnfappPublicApp'
      );
      break;
    default:
      throw new functions.https.HttpsError('failed-precondition', `No environment type detected when creating alt public app`);
  }
  return app;
}

export const altEnvironmentIgnfappPublicApp = getAltEnvironmentIgnfappPublicApp();
