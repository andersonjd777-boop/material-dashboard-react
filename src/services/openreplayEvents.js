/**
 * DCG Admin Dashboard - OpenReplay Custom Events
 * Predefined event tracking functions for critical dashboard actions
 */

import { trackEvent, trackError } from "./openreplay";

// ============================================
// AUTHENTICATION EVENTS
// ============================================

export const AuthEvents = {
  loginAttempt: (email) => {
    trackEvent("auth:login_attempt", { email, timestamp: new Date().toISOString() });
  },

  loginSuccess: (user) => {
    trackEvent("auth:login_success", {
      email: user.email,
      role: user.role,
      timestamp: new Date().toISOString(),
    });
  },

  loginFailed: (email, reason) => {
    trackEvent("auth:login_failed", {
      email,
      reason,
      timestamp: new Date().toISOString(),
    });
  },

  logout: (email) => {
    trackEvent("auth:logout", { email, timestamp: new Date().toISOString() });
  },

  sessionExpired: () => {
    trackEvent("auth:session_expired", { timestamp: new Date().toISOString() });
  },
};

// ============================================
// AUTO-HEALER EVENTS
// ============================================

export const AutoHealerEvents = {
  scanTriggered: (mode) => {
    trackEvent("autohealer:scan_triggered", {
      mode,
      timestamp: new Date().toISOString(),
    });
  },

  modeChanged: (oldMode, newMode) => {
    trackEvent("autohealer:mode_changed", {
      oldMode,
      newMode,
      timestamp: new Date().toISOString(),
    });
  },

  bugDetected: (bugType, severity) => {
    trackEvent("autohealer:bug_detected", {
      bugType,
      severity,
      timestamp: new Date().toISOString(),
    });
  },

  bugFixed: (bugType, fixDuration) => {
    trackEvent("autohealer:bug_fixed", {
      bugType,
      fixDuration,
      timestamp: new Date().toISOString(),
    });
  },
};

// ============================================
// SERVICE MANAGEMENT EVENTS
// ============================================

export const ServiceEvents = {
  serviceRestarted: (serviceName, success) => {
    trackEvent("service:restart", {
      serviceName,
      success,
      timestamp: new Date().toISOString(),
    });
  },

  serviceStatusChecked: (serviceName, status) => {
    trackEvent("service:status_check", {
      serviceName,
      status,
      timestamp: new Date().toISOString(),
    });
  },

  whisperRestart: (success) => {
    trackEvent("service:whisper_restart", { success, timestamp: new Date().toISOString() });
  },

  asteriskRestart: (success) => {
    trackEvent("service:asterisk_restart", { success, timestamp: new Date().toISOString() });
  },
};

// ============================================
// QUICK ACTIONS EVENTS
// ============================================

export const QuickActionEvents = {
  actionExecuted: (actionName, success, duration) => {
    trackEvent("quickaction:executed", {
      actionName,
      success,
      duration,
      timestamp: new Date().toISOString(),
    });
  },

  logsPurged: (filesDeleted, spaceFreed) => {
    trackEvent("quickaction:logs_purged", {
      filesDeleted,
      spaceFreed,
      timestamp: new Date().toISOString(),
    });
  },

  tempCleaned: (success) => {
    trackEvent("quickaction:temp_cleaned", { success, timestamp: new Date().toISOString() });
  },
};

// ============================================
// API PERFORMANCE EVENTS
// ============================================

export const ApiEvents = {
  requestStart: (method, url) => {
    trackEvent("api:request_start", { method, url, timestamp: new Date().toISOString() });
  },

  requestComplete: (method, url, status, duration) => {
    trackEvent("api:request_complete", {
      method,
      url,
      status,
      duration,
      timestamp: new Date().toISOString(),
    });
  },

  requestError: (method, url, error, status) => {
    trackEvent("api:request_error", {
      method,
      url,
      error: error.message || error,
      status,
      timestamp: new Date().toISOString(),
    });
    trackError(error, { method, url, status });
  },

  slowRequest: (method, url, duration) => {
    trackEvent("api:slow_request", {
      method,
      url,
      duration,
      threshold: 3000,
      timestamp: new Date().toISOString(),
    });
  },
};

// ============================================
// NAVIGATION EVENTS
// ============================================

export const NavigationEvents = {
  pageView: (path, title) => {
    trackEvent("navigation:page_view", { path, title, timestamp: new Date().toISOString() });
  },

  featureAccessed: (featureName) => {
    trackEvent("navigation:feature_accessed", {
      featureName,
      timestamp: new Date().toISOString(),
    });
  },
};

export default {
  AuthEvents,
  AutoHealerEvents,
  ServiceEvents,
  QuickActionEvents,
  ApiEvents,
  NavigationEvents,
};
