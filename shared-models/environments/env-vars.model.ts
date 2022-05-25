import { WebDomains } from "../meta/web-urls.model";

export enum EnvironmentTypes {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production'
}

export const PRODUCTION_APPS = {
  ignfappPublicApp: {
    databaseURL: 'https://ignfapp-public.firebaseio.com',
    projectId: 'ignfapp-public',
    storageBucket: 'ignfapp-public.appspot.com',
    websiteDomain: WebDomains.IGNFAPP_PUBLIC
  },
  ignfappAdminApp: {
    databaseURL: 'https://ignfapp-admin.firebaseio.com',
    projectId: 'ignfapp-admin',
    storageBucket: 'ignfapp-admin.appspot.com',
    websiteDomain: WebDomains.IGNFAPP_ADMIN
  },
};

export const SANDBOX_APPS = {
  ignfappPublicApp: {
    databaseURL: 'https://ignfapp-sandbox-public.firebaseio.com',
    projectId: 'ignfapp-sandbox-public',
    storageBucket: 'ignfapp-sandbox-public.appspot.com',
    websiteDomain: 'ignfapp-sandbox-public.web.app'
  },
  ignfappAdminApp: {
    databaseURL: 'https://ignfapp-sandbox-admin.firebaseio.com',
    projectId: 'ignfapp-sandbox-admin',
    storageBucket: 'ignfapp-sandbox-admin.appspot.com',
    websiteDomain: 'ignfapp-sandbox-admin.web.app'
  },
};

export enum ProductionCloudStorage {
  IGNFAPP_PUBLIC_USERS_STORAGE = 'ignfapp-public-users',
  IGNFAPP_PUBLIC_USERS_STORAGE_GS_PREFIX = 'gs://ignfapp-public-users',
  IGNFAPP_ADMIN_BACKUP_STORAGE = 'ignfapp-admin-backup',
  IGNFAPP_ADMIN_BACKUP_STORAGE_GS_PREFIX = 'gs://ignfapp-admin-backup',
  IGNFAPP_ADMIN_REPORTS_STORAGE = 'ignfapp-admin-reports',
  IGNFAPP_ADMIN_REPORTS_STORAGE_GS_PREFIX = 'gs://ignfapp-admin-reports',
}

export enum SandboxCloudStorage {
  IGNFAPP_PUBLIC_USERS_STORAGE = 'ignfapp-sandbox-public-users',
  IGNFAPP_PUBLIC_USERS_STORAGE_GS_PREFIX = 'gs://ignfapp-sandbox-public-users',
  IGNFAPP_ADMIN_BACKUP_STORAGE = 'ignfapp-sandbox-admin-backup',
  IGNFAPP_ADMIN_BACKUP_STORAGE_GS_PREFIX = 'gs://ignfapp-sandbox-admin-backup',
  IGNFAPP_ADMIN_REPORTS_STORAGE = 'ignfapp-sandbox-admin-reports',
  IGNFAPP_ADMIN_REPORTS_STORAGE_GS_PREFIX = 'gs://ignfapp-sandbox-admin-reports',
}

// Currently all apps use the Explearning keys
export enum StripePublishableKeys {
  IGNFAPP_PROD = 'tbd',
  IGNFAPP_SANDBOX = 'tbd',
}
