import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // User is logged in, navigate to dashboard if on login page
        if (location.pathname === "/login" || location.pathname === "/") {
          navigate("/dashboard");
        }
      } else {
        // User is not logged in, navigate to login if not already there
        if (location.pathname !== "/login") {
          navigate("/login");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  const login = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Logged in:", user);
      // Navigation will be handled by onAuthStateChanged
    } catch (error) {
      console.error("Login error:", error.message);
      setLoading(false);
      
      // Handle specific popup errors
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Popup was closed by user");
      } else if (error.code === 'auth/popup-blocked') {
        console.log("Popup was blocked by browser");
        // You could show a message to user about popup blockers
      }
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