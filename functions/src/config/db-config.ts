import { getFirestore } from "firebase-admin/firestore";
import { publicAppFirebaseInstance } from "./app-config";

export const publicFirestore = getFirestore(publicAppFirebaseInstance);
