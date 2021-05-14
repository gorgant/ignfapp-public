import { ignfappAdminApp, ignfappPublicApp, altEnvironmentIgnfappAdminApp } from "./app-config";

export const adminFirestore = ignfappAdminApp.firestore();
export const publicFirestore = ignfappPublicApp.firestore();
export const altEnvAdminFirestore = altEnvironmentIgnfappAdminApp.firestore();
export const altEnvPublicFirestore = altEnvironmentIgnfappAdminApp.firestore();
