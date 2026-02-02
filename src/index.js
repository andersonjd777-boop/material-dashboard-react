/**
 * DCG Admin Dashboard - Entry Point
 * Direct Connect Global Internal Admin Panel
 * Includes OpenReplay session replay and error tracking
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";

// Material Dashboard 2 React Context Provider
import { MaterialUIControllerProvider } from "context";

// Auth Context Provider
import { AuthProvider } from "context/AuthContext";

// Error Boundary for React error handling
import ErrorBoundary from "components/ErrorBoundary";

// OpenReplay for session replay and error tracking
import { initOpenReplay, startSession } from "services/openreplay";

// Initialize OpenReplay tracker before rendering
// This ensures all user interactions are captured from the start
try {
  const tracker = initOpenReplay();
  if (tracker) {
    // Check if user is already logged in (returning session)
    const userData = localStorage.getItem("dcg_admin_user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        startSession({
          email: user.email,
          id: user.id,
          role: user.role,
          metadata: { returningUser: true },
        });
      } catch (e) {
        // Start anonymous session if user data is invalid
        startSession();
      }
    } else {
      // Start anonymous session for unauthenticated users
      startSession();
    }
  }
} catch (error) {
  console.error("[OpenReplay] Failed to initialize:", error);
  // App continues to work even if OpenReplay fails
}

const container = document.getElementById("app");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <ErrorBoundary name="RootErrorBoundary">
      <AuthProvider>
        <MaterialUIControllerProvider>
          <App />
        </MaterialUIControllerProvider>
      </AuthProvider>
    </ErrorBoundary>
  </BrowserRouter>
);
