/**
 * 🛡️ NoSQL Injection & Input Sanitization Utility
 * Essential Rush Security Standards
 */

/**
 * Forces any incoming input to a safe primitive string,
 * preventing object-based NoSQL injections (e.g. { $ne: null }).
 */
export function sanitizeString(input: unknown, maxLength = 255): string {
  if (typeof input !== "string") {
    return "";
  }
  return input.trim().slice(0, maxLength);
}

/**
 * Escapes special regex characters to prevent regular expression 
 * injection or catastrophic backtracking (ReDoS) during database searches.
 */
export function escapeRegex(text: unknown): string {
  const safeText = sanitizeString(text, 100);
  return safeText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Sanitizes and normalizes email inputs.
 */
export function sanitizeEmail(email: unknown): string {
  const clean = sanitizeString(email, 150).toLowerCase();
  // Basic sanity regex check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(clean) ? clean : "";
}

/**
 * Sanitizes phone numbers by stripping non-numeric characters except '+'
 */
export function sanitizePhone(phone: unknown): string {
  const clean = sanitizeString(phone, 20);
  return clean.replace(/[^\d+]/g, "");
}