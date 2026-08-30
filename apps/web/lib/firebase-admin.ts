import { applicationDefault, getApp, getApps, initializeApp } from "firebase-admin/app";
import { config } from "./config";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export const adminApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: applicationDefault(),
        projectId: config.projectId
      });

export const adminAuth = getAuth(adminApp);
export const firestore = getFirestore(adminApp);

export function artifactBucket() {
  return getStorage(adminApp).bucket(config.artifactBucket);
}
