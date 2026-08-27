/**
 * Application Constants and Configuration
 */

// ======================================================
// CART CONFIGURATION
// ======================================================

export const CART_CONFIG = {
  DEFAULT_NAME: "Vault Client",

  STATUSES: [
    "ABANDONED",
    "RECOVERED",
    "CONVERTED",
  ] as const,
} as const;


// ======================================================
// URL CONFIGURATION
// ======================================================

export const URLS = {
  CART_RECOVERY: "/cart",

  DEFAULT_APP_URL:
    "https://essential-ivory.vercel.app",
} as const;


// ======================================================
// WHATSAPP MESSAGES
// ======================================================

export const WHATSAPP_MESSAGES = {
  CART_RECOVERY: (
    clientName: string,
    recoveryLink: string
  ): string => {
    return `Dear ${clientName}, your curated selection has been safely secured in our private vault. Tap here to complete your exclusive acquisition: ${recoveryLink}`;
  },
} as const;


// ======================================================
// ERROR MESSAGES
// ======================================================

export const ERROR_MESSAGES = {
  UNAUTHORIZED:
    "You do not have access to do that.",

  MISSING_LEAD_ID:
    "Missing or invalid leadId",

  LEAD_NOT_FOUND:
    "Lead not found",

  INVALID_PHONE:
    "Lead has no valid phone number",

  DATABASE_ERROR:
    "Database operation failed",

  WHATSAPP_ERROR:
    "WhatsApp link generation failed",

  INTERNAL_ERROR:
    "An unexpected error occurred",
} as const;


// ======================================================
// HTTP STATUS CODES
// ======================================================

export const HTTP_STATUS = {
  OK: 200,

  BAD_REQUEST: 400,

  UNAUTHORIZED: 401,

  FORBIDDEN: 403,

  NOT_FOUND: 404,

  INTERNAL_ERROR: 500,
} as const;