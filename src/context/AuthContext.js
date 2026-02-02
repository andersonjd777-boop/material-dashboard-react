/**
 * DCG Admin Dashboard - Authentication Context
 * Manages user authentication state and JWT tokens
 * Includes OpenReplay integration for user identification
 */

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import api from "services/api";
import { identifyUser, clearUser } from "services/openreplay";
import { AuthEvents } from "services/openreplayEvents";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("dcg_admin_token");
    const userData = localStorage.getItem("dcg_admin_user");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        api.setToken(token);
        // Identify user in OpenReplay for returning sessions
        identifyUser(parsedUser);
      } catch (e) {
        localStorage.removeItem("dcg_admin_token");
        localStorage.removeItem("dcg_admin_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      // Track login attempt in OpenReplay
      AuthEvents.loginAttempt(email);

      const response = await api.post("/admin/auth/login", { email, password });

      if (response.success) {
        const { token, user: userData } = response;
        localStorage.setItem("dcg_admin_token", token);
        localStorage.setItem("dcg_admin_user", JSON.stringify(userData));
        api.setToken(token);
        setUser(userData);

        // Identify user in OpenReplay after successful login
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
    // Track logout and clear OpenReplay user identification
    if (user) {
      AuthEvents.logout(user.email);
    }
    clearUser();

    localStorage.removeItem("dcg_admin_token");
    localStorage.removeItem("dcg_admin_user");
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
