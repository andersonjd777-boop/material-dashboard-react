/**
 * DCG Admin Dashboard - OpenReplay Integration Service
 * Session replay, error tracking, and performance monitoring
 *
 * OpenReplay is an open-source session replay platform that helps
 * debug user issues by recording and replaying user sessions.
 */

import logger from "./logger";

import Tracker from "@openreplay/tracker";

const isDev = process.env.NODE_ENV === "development";

// Configuration - Update these values after deployment
const OPENREPLAY_CONFIG = {
  // Project key from OpenReplay dashboard (required)
  projectKey: process.env.REACT_APP_OPENREPLAY_PROJECT_KEY || "YOUR_PROJECT_KEY",

  // Ingest endpoint - use cloud or self-hosted URL
  // Cloud: https://api.openreplay.com/ingest
  // Self-hosted: https://openreplay.yourdomain.com/ingest
  ingestPoint: process.env.REACT_APP_OPENREPLAY_INGEST_POINT || "https://api.openreplay.com/ingest",

  // Capture console logs
  consoleMethods: ["log", "info", "warn", "error"],

  // Network request tracking
  network: {
    capturePayload: process.env.NODE_ENV !== "production",
    ignoreHeaders: ["Authorization", "Cookie", "X-CSRF-Token"],
    sanitizer: (data) => {
      // Sanitize sensitive data from network payloads
      const sensitiveFields = [
        "password",
        "token",
        "apiKey",
        "api_key",
        "secret",
        "credit_card",
        "creditCard",
        "cardNumber",
        "cvv",
        "ssn",
        "socialSecurity",
        "accessToken",
        "refreshToken",
      ];
      if (data.body && typeof data.body === "string") {
        try {
          const parsed = JSON.parse(data.body);
          sensitiveFields.forEach((field) => {
            if (parsed[field]) parsed[field] = "[REDACTED]";
          });
          data.body = JSON.stringify(parsed);
        } catch (e) {
          // Not JSON, leave as-is
        }
      }
      return data;
    },
  },

  // Respect Do Not Track browser setting
  respectDoNotTrack: true,

  // Session recording options
  obscureTextEmails: true,
  obscureTextNumbers: false,
  obscureInputEmails: true,
  defaultInputMode: 1, // 0 = plain, 1 = obscured, 2 = hidden
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
    logger.warn("[OpenReplay] Tracker already initialized");
    return trackerInstance;
  }

  // Don't initialize if project key is not set
  if (OPENREPLAY_CONFIG.projectKey === "YOUR_PROJECT_KEY") {
    logger.warn("[OpenReplay] Project key not configured. Skipping initialization.");
    return null;
  }

  try {
    trackerInstance = new Tracker(OPENREPLAY_CONFIG);
    logger.log("[OpenReplay] Tracker initialized");
    return trackerInstance;
  } catch (error) {
    logger.error("[OpenReplay] Failed to initialize tracker:", error);
    return null;
  }
}

/**
 * Start the OpenReplay session
 * Call this after user authentication or on app load
 */
export async function startSession(userInfo = {}) {
  if (!trackerInstance) {
    logger.warn("[OpenReplay] Tracker not initialized");
    return false;
  }

  if (isStarted) {
    logger.warn("[OpenReplay] Session already started");
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
    if (isDev)
      logger.log("[OpenReplay] Session started", userInfo.email ? `for ${userInfo.email}` : "");
    return true;
  } catch (error) {
    logger.error("[OpenReplay] Failed to start session:", error);
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
    logger.log("[OpenReplay] User identified:", user.email);
  } catch (error) {
    logger.error("[OpenReplay] Failed to identify user:", error);
  }
}

/**
 * Clear user identification (call on logout)
 */
export function clearUser() {
  if (!trackerInstance || !isStarted) return;

  try {
    trackerInstance.setUserID(null);
    logger.log("[OpenReplay] User cleared");
  } catch (error) {
    logger.error("[OpenReplay] Failed to clear user:", error);
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
    logger.error("[OpenReplay] Failed to track event:", error);
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
    logger.error("[OpenReplay] Failed to track error:", err);
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
