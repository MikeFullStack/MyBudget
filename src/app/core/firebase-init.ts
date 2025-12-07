import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

export let app: FirebaseApp;
export let auth: Auth;
export let db: Firestore;
export let firebaseConfig: any = {};

export const initializeFirebase = (config: any) => {
    firebaseConfig = config;
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
};
