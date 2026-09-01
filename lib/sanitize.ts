/**
 * 🛡️ NoSQL Injection, ReDoS & Input Sanitization Utility
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
  return input.replace(/\0/g, "").trim().slice(0, maxLength);
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

/**
 * Recursively strips MongoDB operators starting with '$' or containing '.'
 */
export function sanitizeNoSqlInput(input: any): any {
  if (typeof input !== "object" || input === null) {
    if (typeof input === "string") {
      return input.replace(/\0/g, "").trim();
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeNoSqlInput);
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!key.startsWith("$") && !key.includes(".")) {
      cleaned[key] = sanitizeNoSqlInput(value);
    }
  }
  return cleaned;
}

/**
 * 🛡️ Strict 8-Character Password Complexity Enforcer
 * Rules:
 * - Exactly 8 characters (Min 8, Max 8)
 * - Minimum 1 Uppercase [A-Z]
 * - Minimum 1 Lowercase [a-z]
 * - Minimum 1 Digit [0-9]
 * - Minimum 1 Special Character [@$!%*?&#^()_+\-=\[\]{}|;:,.<>/~`"]
 */
export function validatePasswordStrength(password: unknown): { isValid: boolean; error?: string } {
  if (typeof password !== "string") {
    return { isValid: false, error: "Password must be a valid text string." };
  }

  if (password.length !== 8) {
    return { isValid: false, error: "Password must be exactly 8 characters long." };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[@$!%*?&#^()_+\-=\[\]{}|;:,.<>/~`"'\\]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return {
      isValid: false,
      error: "Password must contain a mix of uppercase (A-Z), lowercase (a-z), numbers (0-9), and special characters (@#$!).",
    };
  }

  return { isValid: true };
}