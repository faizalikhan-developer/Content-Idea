import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login, loading } = useAuth();

  // Add this for debugging
  useEffect(() => {
    console.log("Login component mounted");
    console.log("Current URL:", window.location.href);
    console.log("Current origin:", window.location.origin);
    console.log("User agent:", navigator.userAgent);
  }, []);

  const handleLogin = () => {
    console.log("Login button clicked"); // Debug log
    login();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#210F37] text-gray-200 px-4 sm:px-6 lg:px-8">
      {loading ? (
        <div className="text-base sm:text-lg">Loading...</div>
      ) : (
        <div className="p-4 sm:p-6 bg-[#4F1C51] rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#DCA06D] mb-4 sm:mb-6 text-center">
            Content Idea Logger
          </h1>
          <button
            onClick={handleLogin}
            className="w-full bg-[#A55B4B] text-gray-200 py-2 px-4 rounded-md text-sm sm:text-base font-medium hover:bg-[#210F37] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
          >
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}

export default Login;