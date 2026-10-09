import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from './config.js';

let app;
if (getApps().length) {
  app = getApps()[0];
} else {
  if (!config.firebaseProjectId) {
    console.warn('FIREBASE_PROJECT_ID is not set. Firebase-backed routes will not work until configured.');
  }
  app = initializeApp({
    credential: applicationDefault(),
    ...(config.firebaseProjectId ? { projectId: config.firebaseProjectId } : {})
  });
}

export const adminAuth = getAuth(app);
export const db = getFirestore(app);
