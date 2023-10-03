import { getStorage } from "firebase-admin/storage";
import { publicAppFirebaseInstance } from "./app-config";

export const ignfappPublicStorage = getStorage(publicAppFirebaseInstance);