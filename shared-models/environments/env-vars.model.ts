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
  IGNFAPP_ADMIN_BLOG_STORAGE_AF_CF = 'ignfapp-admin-blog',
  IGNFAPP_ADMIN_BLOG_STORAGE_FB = 'gs://ignfapp-admin-blog',
  IGNFAPP_ADMIN_PRODUCTS_STORAGE_AF_CF = 'ignfapp-admin-products',
  IGNFAPP_ADMIN_PRODUCTS_STORAGE_FB = 'gs://ignfapp-admin-products',
  IGNFAPP_ADMIN_BACKUP_STORAGE_AF_CF = 'ignfapp-admin-backup',
  IGNFAPP_ADMIN_BACKUP_STORAGE_FB = 'gs://ignfapp-admin-backup',
  IGNFAPP_ADMIN_REPORTS_STORAGE_AF_CF = 'ignfapp-admin-reports',
  IGNFAPP_ADMIN_REPORTS_STORAGE_FB = 'gs://ignfapp-admin-reports',
}

export enum SandboxCloudStorage {
  IGNFAPP_ADMIN_BLOG_STORAGE_AF_CF = 'ignfapp-sandbox-admin-blog',
  IGNFAPP_ADMIN_BLOG_STORAGE_FB = 'gs://ignfapp-sandbox-admin-blog',
  IGNFAPP_ADMIN_PRODUCTS_STORAGE_AF_CF = 'ignfapp-sandbox-admin-products',
  IGNFAPP_ADMIN_PRODUCTS_STORAGE_FB = 'gs://ignfapp-sandbox-admin-products',
  IGNFAPP_ADMIN_BACKUP_STORAGE_AF_CF = 'ignfapp-sandbox-admin-backup',
  IGNFAPP_ADMIN_BACKUP_STORAGE_FB = 'gs://ignfapp-sandbox-admin-backup',
  IGNFAPP_ADMIN_REPORTS_STORAGE_AF_CF = 'ignfapp-sandbox-admin-reports',
  IGNFAPP_ADMIN_REPORTS_STORAGE_FB = 'gs://ignfapp-sandbox-admin-reports',
}

// Currently all apps use the Explearning keys
export enum StripePublishableKeys {
  IGNFAPP_PROD = 'tbd',
  IGNFAPP_SANDBOX = 'tbd',
}
