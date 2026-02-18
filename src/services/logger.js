/**
 * DCG Admin Dashboard - Centralized Logger
 * Production-safe logging utility that suppresses output in production builds.
 * Replaces raw console.* calls to prevent information leakage in production.
 *
 * Usage:
 *   import logger from "services/logger";
 *   logger.error("Failed to fetch:", error);
 *   logger.warn("Deprecation notice:", msg);
 *   logger.log("Debug info:", data);
 */

const isDev = process.env.NODE_ENV === "development";

const noop = () => {};

const logger = {
  log: isDev ? console.log.bind(console) : noop,
  warn: isDev ? console.warn.bind(console) : noop,
  error: isDev ? console.error.bind(console) : noop,
  info: isDev ? console.info.bind(console) : noop,
  debug: isDev ? console.debug.bind(console) : noop,
};

export default logger;
