// firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6ah1AD2ebv9_4Djpgy9sqDGe_lMwOXaQ",
  authDomain: "content-idea-29f45.firebaseapp.com",
  projectId: "content-idea-29f45",
  storageBucket: "content-idea-29f45.firebasestorage.app",
  messagingSenderId: "634049327430",
  appId: "1:634049327430:web:4f2a9971160938b4e17547",
  measurementId: "G-FRBFPSS3BW",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Configure Auth settings for better mobile/PWA support
auth.languageCode = 'en';

// Enable Auth persistence (helpful for PWAs)
if (typeof window !== 'undefined') {
  // Set auth persistence to LOCAL for better PWA experience
  import('firebase/auth').then(({ setPersistence, browserLocalPersistence }) => {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.warn('Auth persistence setup failed:', error);
    });
  });
}

// Development emulator connection (optional)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const useEmulator = false; // Set to true if using Firebase emulators
  
  if (useEmulator) {
    try {
      // Connect to emulators only once
      if (!auth._delegate._config.emulator) {
        connectAuthEmulator(auth, "http://localhost:9099");
      }
      if (!db._delegate._databaseId.host.includes('localhost')) {
        connectFirestoreEmulator(db, 'localhost', 8080);
      }
    } catch (error) {
      console.warn('Emulator connection failed:', error);
    }
  }
}

export async function pushIdeas(userId, ideas) {
  const ideasCollection = collection(db, "ideas");
  const results = [];

  for (const idea of ideas) {
    const { id, ...ideaData } = idea;

    try {
      if (idea.deleted && idea.cloudId) {
        // Handle deletion: remove from cloud if it exists
        const ideaRef = doc(db, "ideas", idea.cloudId);
        await deleteDoc(ideaRef);
        results.push({ localId: id, cloudId: idea.cloudId, action: "deleted" });
      } else if (!idea.deleted) {
        // Handle creation: add new idea to cloud
        const docRef = await addDoc(ideasCollection, { 
          ...ideaData, 
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        results.push({ localId: id, cloudId: docRef.id, action: "created" });
      }
      // Note: if deleted but no cloudId, it was never synced, so just ignore
    } catch (error) {
      throw new Error(`Failed to push idea ${id}: ${error.message}`);
    }
  }
  return results;
}

export async function pushDrafts(userId, drafts) {
  const draftsCollection = collection(db, "drafts");
  const results = [];

  for (const draft of drafts) {
    const { id, ...draftData } = draft;

    try {
      if (draft.deleted && draft.cloudId) {
        // Handle deletion: remove from cloud if it exists
        const draftRef = doc(db, "drafts", draft.cloudId);
        await deleteDoc(draftRef);
        results.push({
          localId: id,
          cloudId: draft.cloudId,
          action: "deleted",
        });
      } else if (!draft.deleted) {
        // Handle creation: add new draft to cloud
        const docRef = await addDoc(draftsCollection, { 
          ...draftData, 
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        results.push({ localId: id, cloudId: docRef.id, action: "created" });
      }
      // Note: if deleted but no cloudId, it was never synced, so just ignore
    } catch (error) {
      throw new Error(`Failed to push draft ${id}: ${error.message}`);
    }
  }
  return results;
}

export async function syncIdeas(userId) {
  const ideasCollection = collection(db, "ideas");
  const q = query(ideasCollection, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const cloudIdeas = querySnapshot.docs.map((doc) => ({
    cloudId: doc.id,
    ...doc.data(),
  }));
  return cloudIdeas;
}

export async function syncDrafts(userId) {
  const draftsCollection = collection(db, "drafts");
  const q = query(draftsCollection, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const cloudDrafts = querySnapshot.docs.map((doc) => ({
    cloudId: doc.id,
    ...doc.data(),
  }));
  return cloudDrafts;
}

export async function updateIdeaSyncStatus(cloudId, syncStatus) {
  const ideaRef = doc(db, "ideas", cloudId);
  await updateDoc(ideaRef, { 
    syncStatus,
    updatedAt: new Date()
  });
}

export async function updateDraftSyncStatus(cloudId, syncStatus) {
  const draftRef = doc(db, "drafts", cloudId);
  await updateDoc(draftRef, { 
    syncStatus,
    updatedAt: new Date()
  });
}