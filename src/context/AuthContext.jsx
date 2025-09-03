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
