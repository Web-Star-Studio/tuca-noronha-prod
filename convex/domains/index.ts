"use node";

/**
 * Domain exports
 * This file provides access to all domain-specific functionality
 */

// Export activities domain
export * as activities from "./activities";

// Export bookings domain for all booking operations
export * as bookings from "./bookings";

// Export events domain
export * as events from "./events";

// Export media domain
export * as media from "./media";

// Export restaurants domain
export * as restaurants from "./restaurants";

// Export users domain
export * as users from "./users";

// Export RBAC domain for permissions and employee management
export * as rbac from "./rbac";

// Export packages domain
export * as packages from "./packages";

// Export chat domain for real-time messaging
export * as chat from "./chat";

// Export recommendations domain for cache and AI recommendations
export * as recommendations from "./recommendations";

// Export email domain for automated email notifications
export * as email from "./email";

// Export system settings domain for global configuration management
export * as systemSettings from "./systemSettings";

// Export subscriptions domain for guide subscription management
export * as subscriptions from "./subscriptions"; 