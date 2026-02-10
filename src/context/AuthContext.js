/**
 * DCG Admin Dashboard - Authentication Context
 * Manages user authentication state and JWT tokens
 * Includes OpenReplay integration for user identification
 */

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { jwtDecode } from "jwt-decode";
import api from "services/api";
import { identifyUser, clearUser } from "services/openreplay";
import { AuthEvents } from "services/openreplayEvents";

const AuthContext = createContext(null);

// Storage key constants
const STORAGE_KEYS = {
  TOKEN: "dcg_admin_token",
  USER: "dcg_admin_user",
  REMEMBER: "dcg_admin_remember",
};

/**
 * Check if a JWT token is expired (with 60s buffer)
 */
function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    if (!decoded.exp) return false; // No expiry claim — treat as valid
    return decoded.exp * 1000 < Date.now() - 60000;
  } catch {
    return true;
  }
}

/**
 * Get the appropriate storage based on Remember Me preference
 */
function getStorage() {
  return localStorage.getItem(STORAGE_KEYS.REMEMBER) === "true" ? localStorage : sessionStorage;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token on mount (check both storages)
  useEffect(() => {
    const token =
      localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    const userData =
      localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);

    if (token && userData) {
      if (isTokenExpired(token)) {
        // Token expired — clear everything
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER);
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.USER);
      } else {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          api.setToken(token);
          identifyUser(parsedUser);
        } catch (e) {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
          sessionStorage.removeItem(STORAGE_KEYS.USER);
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      setError(null);
      setLoading(true);

      AuthEvents.loginAttempt(email);

      const response = await api.post("/admin/auth/login", { email, password });

      if (response.success) {
        const { token, user: userData } = response;

        // Store Remember Me preference in localStorage (always)
        localStorage.setItem(STORAGE_KEYS.REMEMBER, String(rememberMe));

        // Store token/user in the appropriate storage
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(STORAGE_KEYS.TOKEN, token);
        storage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

        api.setToken(token);
        setUser(userData);

        identifyUser(userData);
        AuthEvents.loginSuccess(userData);

        return { success: true };
      } else {
        AuthEvents.loginFailed(email, response.message || "Login failed");
        setError(response.message || "Login failed");
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      AuthEvents.loginFailed(email, message);
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (user) {
      AuthEvents.logout(user.email);
    }
    clearUser();

    // Clear both storages
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    api.setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      isAuthenticated: !!user,
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
