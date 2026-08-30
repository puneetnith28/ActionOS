import { applicationDefault, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export const adminApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: applicationDefault(),
        ...(process.env.GOOGLE_CLOUD_PROJECT ? { projectId: process.env.GOOGLE_CLOUD_PROJECT } : {})
      });

export const adminAuth = getAuth(adminApp);
export const firestore = getFirestore(adminApp);

export function artifactBucket() {
  const bucketName = process.env.ACTIONOS_ARTIFACT_BUCKET;
  if (!bucketName) throw new Error("ARTIFACT_BUCKET_NOT_CONFIGURED");
  return getStorage(adminApp).bucket(bucketName);
}
