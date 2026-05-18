import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));

const app = admin.initializeApp({ projectId: firebaseConfig.projectId });
console.log('App initialized');

const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
console.log('Firestore initialized');
