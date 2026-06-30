import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let db: any;
let auth: any;
let isMock = false;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountKey) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore();
    auth = admin.auth();
    console.log('⚡ Firebase Admin initialized with Service Account.');
  } else if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) {
    admin.initializeApp({ projectId: 'college-social-network' });
    db = admin.firestore();
    auth = admin.auth();
    console.log('⚡ Connected to Firebase Local Emulators.');
  } else {
    console.warn('⚠️ No Firebase credentials or emulators detected. Falling back to local data store.');
    isMock = true;
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase SDK:', error);
  isMock = true;
}

export { db, auth, isMock };
