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

// Configure the provider ONCE with proper scopes
const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');
// Force account selection to avoid silent failures
provider.setCustomParameters({
  prompt: 'select_account'
});

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirectHandled, setRedirectHandled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle redirect results (needed for mobile/PWA)
  useEffect(() => {
    if (redirectHandled) return;
    
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Redirect login success:", result.user);
          setUser(result.user);
          setRedirectHandled(true);
        }
      } catch (error) {
        console.error("Redirect login error:", error.code, error.message);
        setLoading(false);
      }
      setRedirectHandled(true);
    };

    handleRedirectResult();
  }, [redirectHandled]);

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser ? "logged in" : "logged out");
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        if (location.pathname === "/login" || location.pathname === "/") {
          navigate("/dashboard");
        }
      } else {
        if (location.pathname !== "/login" && location.pathname !== "/") {
          navigate("/login");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  // Environment-aware login with better mobile detection
  const login = async () => {
    try {
      setLoading(true);
      console.log("Login attempt started");

      // More comprehensive mobile/PWA detection
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                          window.navigator.standalone === true; // iOS Safari
      const isTouch = 'ontouchstart' in window;
      const isSmallScreen = window.innerWidth <= 768;
      
      // Use redirect for mobile, touch devices, or PWA
      const useRedirect = isMobile || isStandalone || (isTouch && isSmallScreen);

      console.log("Login method decision:", {
        isMobile,
        isStandalone,
        isTouch,
        isSmallScreen,
        useRedirect,
        userAgent: navigator.userAgent
      });

      if (useRedirect) {
        console.log("Using redirect login for mobile/PWA environment");
        setRedirectHandled(false); // Reset flag before redirect
        await signInWithRedirect(auth, provider);
        // Don't set loading to false here - redirect will handle it
      } else {
        console.log("Using popup login for desktop environment");
        const result = await signInWithPopup(auth, provider);
        console.log("Popup login success:", result.user);
        setUser(result.user);
        setLoading(false);
      }
    } catch (error) {
      console.error("Login error details:", {
        code: error.code,
        message: error.message,
        customData: error.customData
      });
      
      // Handle specific error cases
      if (error.code === 'auth/popup-blocked') {
        console.log("Popup blocked, falling back to redirect");
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError) {
          console.error("Redirect fallback failed:", redirectError);
          setLoading(false);
        }
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log("User closed popup");
        setLoading(false);
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log("Popup request cancelled");
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}