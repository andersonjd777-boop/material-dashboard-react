/**
 * DCG Admin Dashboard - Authentication Context
 * Manages user authentication state and JWT tokens
 * Supports: Email+Password (IMAP), Google OAuth, Email Code (OTP)
 * Includes OpenReplay integration for user identification
 * Features: token expiry check, Remember Me, idle timeout
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
    if (!decoded.exp) return true; // No expiry claim — treat as expired for safety
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

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const idleTimerRef = useRef(null);

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

  const logout = useCallback(() => {
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

    // Clear idle timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, [user]);

  // Session inactivity timeout (15 minutes)
  useEffect(() => {
    if (!user) return;

    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        logout();
      }, IDLE_TIMEOUT_MS);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer(); // Start the timer

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, logout]);

  // Helper: store auth result (supports Remember Me)
  const handleAuthSuccess = useCallback((response, rememberMe = true) => {
    const { token, user: userData } = response;

    // Store Remember Me preference
    localStorage.setItem(STORAGE_KEYS.REMEMBER, String(rememberMe));

    // Store in appropriate storage
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEYS.TOKEN, token);
    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

    api.setToken(token);
    setUser(userData);
    identifyUser(userData);
    AuthEvents.loginSuccess(userData);
    return { success: true };
  }, []);

  // Login method 1: Email + Password (IMAP SSO)
  const login = useCallback(
    async (email, password, rememberMe = false) => {
      try {
        setError(null);
        setLoading(true);

        AuthEvents.loginAttempt(email);

        const response = await api.post("/admin/auth/login", { email, password });

        if (response.success) {
          return handleAuthSuccess(response, rememberMe);
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
    },
    [handleAuthSuccess]
  );

  // Login method 2: Google OAuth
  const loginWithGoogle = useCallback(
    async (credential) => {
      try {
        setError(null);
        setLoading(true);

        const response = await api.post("/admin/auth/google", { credential });

        if (response.success) {
          return handleAuthSuccess(response, true); // Google login always remembers
        } else {
          setError(response.message || "Google login failed");
          return { success: false, message: response.message };
        }
      } catch (err) {
        const message = err.response?.data?.message || "Google login failed";
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  // Login method 3a: Send OTP code
  const sendLoginCode = useCallback(async (email) => {
    try {
      setError(null);

      const response = await api.post("/admin/auth/send-code", { email });

      if (response.success) {
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message || "Failed to send code" };
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to send code";
      return { success: false, message };
    }
  }, []);

  // Login method 3b: Verify OTP code
  const loginWithCode = useCallback(
    async (email, code) => {
      try {
        setError(null);
        setLoading(true);

        const response = await api.post("/admin/auth/verify-code", { email, code });

        if (response.success) {
          return handleAuthSuccess(response, true);
        } else {
          setError(response.message || "Invalid code");
          return { success: false, message: response.message };
        }
      } catch (err) {
        const message = err.response?.data?.message || "Invalid or expired code";
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      loginWithGoogle,
      loginWithCode,
      sendLoginCode,
      logout,
      isAuthenticated: !!user,
    }),
    [user, loading, error, login, loginWithGoogle, loginWithCode, sendLoginCode, logout]
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
