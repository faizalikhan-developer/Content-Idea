// AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../utils/firebase";

const provider = new GoogleAuthProvider();
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 handle redirect results (needed for mobile/PWA)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Redirect login success:", result.user);
          setUser(result.user);
        }
      })
      .catch((error) => {
        if (error) console.error("Redirect login error:", error.message);
      });
  }, []);

  // 👇 handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        if (location.pathname === "/login" || location.pathname === "/") {
          navigate("/dashboard");
        }
      } else {
        if (location.pathname !== "/login") {
          navigate("/login");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  // 👇 environment-aware login
  const login = async () => {
    try {
      setLoading(true);

      const provider = new GoogleAuthProvider();

      // Check if mobile or PWA
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;

      if (isMobile || isStandalone) {
        console.log("Using redirect login (mobile/PWA)");
        await signInWithRedirect(auth, provider);
      } else {
        console.log("Using popup login (desktop)");
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error("Login error:", error.code, error.message);
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
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
        const docRef = await addDoc(ideasCollection, { ...ideaData, userId });
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
        const docRef = await addDoc(draftsCollection, { ...draftData, userId });
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
  await updateDoc(ideaRef, { syncStatus });
}

export async function updateDraftSyncStatus(cloudId, syncStatus) {
  const draftRef = doc(db, "drafts", cloudId);
  await updateDoc(draftRef, { syncStatus });
}

// manifest.json

{
  "name": "Content Idea",
  "short_name": "ContentIdea",
  "description": "Write and save content idea, create content draft",
  "theme_color": "#1e40af",
  "background_color": "#f3f4f6",
  "display": "standalone",
  "start_url": "/",
  "scope": "/",
  "orientation": "portrait-primary",
  "lang": "en",
  "dir": "ltr",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}

// vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "android-chrome-192x192.png",
        "android-chrome-512x512.png",
        "maskable-icon.png",
        "manifest.json",
      ],
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,ico,json}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: { cacheName: "html-cache" },
          },
          {
            urlPattern: ({ request }) =>
              ["script", "style", "image", "manifest"].includes(
                request.destination
              ),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "asset-cache" },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});

// vercel.json

{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
