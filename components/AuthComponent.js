import React, { useState, useEffect } from "react";
import { signUp, login, logout } from "../firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const AuthComponent = ({ setIsLoggedIn }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [authType, setAuthType] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (loggedInUser) => {
      setUser(loggedInUser);
      setIsLoggedIn(!!loggedInUser);
    });

    return () => unsubscribe();
  }, [setIsLoggedIn]);

  const openModal = (type) => {
    setAuthType(type);
    setIsOpen(true);
    setError(null);
  };

  const closeModal = () => {
    if (loading) return;
    setIsOpen(false);
    setEmail("");
    setPassword("");
    setError(null);
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (authType === "signup") {
        await signUp(email, password);
      } else {
        await login(email, password);
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {!user ? (
        <div className="flex space-x-7">
          <span
            onClick={() => openModal("signup")}
            className="cursor-pointer text-lg font-medium text-white hover:text-gray-300"
          >
            Sign Up
          </span>
          <span
            onClick={() => openModal("login")}
            className="cursor-pointer text-lg font-medium text-white hover:text-gray-300"
          >
            Login
          </span>
        </div>
      ) : (
        <span
          onClick={handleLogout}
          className="cursor-pointer text-lg font-medium text-red-500 hover:text-red-700"
        >
          Logout
        </span>
      )}

      {/* Modal for Login/Sign Up */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <motion.div
            className="bg-white p-6 rounded-lg shadow-xl w-96 max-w-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-2xl font-semibold text-center mb-4">
              {authType === "signup" ? "Create an Account" : "Welcome Back"}
            </h2>

            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3"
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4"
              disabled={loading}
            />

            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

            <div className="flex justify-between">
              <motion.span
                onClick={handleAuth}
                className={`bg-blue-500 text-white rounded-lg px-4 py-2 cursor-pointer ${
                  loading ? "opacity-50" : "hover:bg-blue-600"
                }`}
              >
                {loading
                  ? "Processing..."
                  : authType === "signup"
                  ? "Sign Up"
                  : "Login"}
              </motion.span>
              <span
                onClick={closeModal}
                className="text-gray-500 cursor-pointer"
              >
                Cancel
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AuthComponent;
