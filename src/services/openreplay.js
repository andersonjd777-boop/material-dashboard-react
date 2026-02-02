/**
 * DCG Admin Dashboard - OpenReplay Integration Service
 * Session replay, error tracking, and performance monitoring
 *
 * OpenReplay is an open-source session replay platform that helps
 * debug user issues by recording and replaying user sessions.
 */

import Tracker from "@openreplay/tracker";

// Configuration - Update these values after deployment
const OPENREPLAY_CONFIG = {
  // Project key from OpenReplay dashboard (required)
  projectKey: process.env.REACT_APP_OPENREPLAY_PROJECT_KEY || "YOUR_PROJECT_KEY",

  // Ingest endpoint - use cloud or self-hosted URL
  // Cloud: https://api.openreplay.com/ingest
  // Self-hosted: https://openreplay.yourdomain.com/ingest
  ingestPoint: process.env.REACT_APP_OPENREPLAY_INGEST_POINT || "https://api.openreplay.com/ingest",

  // Enable verbose logging in development
  __DISABLE_SECURE_MODE: process.env.NODE_ENV === "development",

  // Capture console logs
  consoleMethods: ["log", "info", "warn", "error"],

  // Network request tracking
  network: {
    capturePayload: true,
    ignoreHeaders: ["Authorization", "Cookie"],
    sanitizer: (data) => {
      // Sanitize sensitive data from network payloads
      if (data.body && typeof data.body === "string") {
        try {
          const parsed = JSON.parse(data.body);
          if (parsed.password) parsed.password = "[REDACTED]";
          if (parsed.token) parsed.token = "[REDACTED]";
          if (parsed.apiKey) parsed.apiKey = "[REDACTED]";
          data.body = JSON.stringify(parsed);
        } catch (e) {
          // Not JSON, leave as-is
        }
      }
      return data;
    },
  },

  // Respect Do Not Track browser setting
  respectDoNotTrack: false,

  // Session recording options
  obscureTextEmails: true,
  obscureTextNumbers: false,
  obscureInputEmails: true,
  defaultInputMode: 0, // 0 = plain, 1 = obscured, 2 = hidden
};

// Singleton tracker instance
let trackerInstance = null;
let isStarted = false;

/**
 * Initialize the OpenReplay tracker
 * Call this once at application startup
 */
export function initOpenReplay() {
  if (trackerInstance) {
    console.warn("[OpenReplay] Tracker already initialized");
    return trackerInstance;
  }

  // Don't initialize if project key is not set
  if (OPENREPLAY_CONFIG.projectKey === "YOUR_PROJECT_KEY") {
    console.warn("[OpenReplay] Project key not configured. Skipping initialization.");
    return null;
  }

  try {
    trackerInstance = new Tracker(OPENREPLAY_CONFIG);
    console.log("[OpenReplay] Tracker initialized");
    return trackerInstance;
  } catch (error) {
    console.error("[OpenReplay] Failed to initialize tracker:", error);
    return null;
  }
}

/**
 * Start the OpenReplay session
 * Call this after user authentication or on app load
 */
export async function startSession(userInfo = {}) {
  if (!trackerInstance) {
    console.warn("[OpenReplay] Tracker not initialized");
    return false;
  }

  if (isStarted) {
    console.warn("[OpenReplay] Session already started");
    return true;
  }

  try {
    await trackerInstance.start({
      userID: userInfo.email || userInfo.id || undefined,
      metadata: {
        environment: process.env.NODE_ENV || "production",
        app: "dcg-admin-dashboard",
        version: process.env.REACT_APP_VERSION || "1.0.0",
        role: userInfo.role || "unknown",
        ...userInfo.metadata,
      },
    });
    isStarted = true;
    console.log("[OpenReplay] Session started", userInfo.email ? `for ${userInfo.email}` : "");
    return true;
  } catch (error) {
    console.error("[OpenReplay] Failed to start session:", error);
    return false;
  }
}

/**
 * Identify the current user (call after login)
 */
export function identifyUser(user) {
  if (!trackerInstance || !isStarted) return;

  try {
    trackerInstance.setUserID(user.email || user.id);
    trackerInstance.setMetadata("userName", user.name || "Unknown");
    trackerInstance.setMetadata("userRole", user.role || "user");
    trackerInstance.setMetadata("userId", user.id || "unknown");
    console.log("[OpenReplay] User identified:", user.email);
  } catch (error) {
    console.error("[OpenReplay] Failed to identify user:", error);
  }
}

/**
 * Clear user identification (call on logout)
 */
export function clearUser() {
  if (!trackerInstance || !isStarted) return;

  try {
    trackerInstance.setUserID(null);
    console.log("[OpenReplay] User cleared");
  } catch (error) {
    console.error("[OpenReplay] Failed to clear user:", error);
  }
}

/**
 * Track a custom event
 */
export function trackEvent(name, payload = {}) {
  if (!trackerInstance || !isStarted) return;

  try {
    trackerInstance.event(name, payload);
  } catch (error) {
    console.error("[OpenReplay] Failed to track event:", error);
  }
}

/**
 * Track an error
 */
export function trackError(error, metadata = {}) {
  if (!trackerInstance || !isStarted) return;

  try {
    trackerInstance.handleError(error, metadata);
  } catch (err) {
    console.error("[OpenReplay] Failed to track error:", err);
  }
}

// Export tracker instance getter
export function getTracker() {
  return trackerInstance;
}

export function isTrackerStarted() {
  return isStarted;
}

export default {
  initOpenReplay,
  startSession,
  identifyUser,
  clearUser,
  trackEvent,
  trackError,
  getTracker,
  isTrackerStarted,
};
