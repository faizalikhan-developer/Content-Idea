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

  // Simplified login - always use redirect for better compatibility
  const login = async () => {
    try {
      setLoading(true);
      console.log("Login attempt started");

      // Check if we're in a mobile environment or popup blockers are likely
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                          window.navigator.standalone === true;
      const isTouch = 'ontouchstart' in window;
      const isSmallScreen = window.innerWidth <= 768;
      
      // For better UX, default to redirect in most cases
      const useRedirect = isMobile || isStandalone || isTouch || isSmallScreen;

      console.log("Environment detection:", {
        isMobile,
        isStandalone,
        isTouch,
        isSmallScreen,
        useRedirect,
        userAgent: navigator.userAgent.substring(0, 100) + "..."
      });

      if (useRedirect) {
        console.log("Using redirect login (recommended for mobile/touch devices)");
        setRedirectHandled(false);
        await signInWithRedirect(auth, provider);
        // Don't set loading to false - page will redirect
        return;
      }

      // Try popup for desktop, with immediate fallback to redirect
      console.log("Attempting popup login for desktop");
      try {
        const result = await signInWithPopup(auth, provider);
        console.log("Popup login success:", result.user);
        setUser(result.user);
        setLoading(false);
      } catch (popupError) {
        console.warn("Popup failed, using redirect fallback:", popupError.code);
        
        // Any popup error should fallback to redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          
          console.log("Switching to redirect method due to popup issue");
          setRedirectHandled(false);
          await signInWithRedirect(auth, provider);
          return;
        }
        
        // Re-throw other errors
        throw popupError;
      }
      
    } catch (error) {
      console.error("Login error:", {
        code: error.code,
        message: error.message,
        stack: error.stack?.substring(0, 200)
      });
      
      setLoading(false);
      
      // Show user-friendly error message
      if (error.code === 'auth/network-request-failed') {
        alert('Network error. Please check your connection and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        alert('Too many attempts. Please wait a moment and try again.');
      } else {
        alert('Login failed. Please try again.');
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