"use node";

// Email domain exports
export * from "./types";
export * from "./config";
export * from "./service";

// Re-export key functions for convenience
export { getEmailService, sendQuickEmail } from "./service";
export { getEmailConfig, SYSTEM_EMAILS, EMAIL_SETTINGS } from "./config";
export { getEmailTemplate } from "./templates";

// Email types for easy import
export type {
  EmailData,
  EmailType,
  EmailLog,
  BookingConfirmationEmailData,
  BookingCancelledEmailData,
  PackageRequestReceivedEmailData,
  PartnerNewBookingEmailData,
  WelcomeNewUserEmailData,
  SupportMessageEmailData,
} from "./types"; 