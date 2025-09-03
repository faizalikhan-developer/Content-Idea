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

  // Simplified login - force redirect for better reliability
  const login = async () => {
    try {
      setLoading(true);
      console.log("Login attempt started");

      // Always use redirect for better compatibility across all environments
      console.log("Using redirect login for maximum compatibility");
      setRedirectHandled(false);
      
      // Use the configured provider
      await signInWithRedirect(auth, provider);
      
      // Don't set loading to false - page will redirect
      
    } catch (error) {
      console.error("Login error:", {
        code: error.code,
        message: error.message,
        stack: error.stack?.substring(0, 200)
      });
      
      setLoading(false);
      
      // Show user-friendly error messages
      if (error.code === 'auth/network-request-failed') {
        alert('Network error. Please check your connection and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        alert('Too many attempts. Please wait a moment and try again.');
      } else if (error.code === 'auth/operation-not-allowed') {
        alert('Google Sign-in is not enabled. Please contact support.');
      } else if (error.code === 'auth/invalid-api-key') {
        alert('Configuration error. Please contact support.');
      } else if (error.code === 'auth/app-not-authorized') {
        alert('App not authorized. Please contact support.');
      } else {
        alert(`Login failed: ${error.message || 'Please try again.'}`);
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