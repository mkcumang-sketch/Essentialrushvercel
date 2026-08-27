/**
 * Validates and formats phone numbers for WhatsApp
 * Supports Indian format (10 digits) and international format
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formattedNumber: string;
  error?: string;
}

const COUNTRY_CODES: Record<number, string> = {
  10: "91", // India
};

export function validateAndFormatPhone(
  phoneInput: string | undefined
): PhoneValidationResult {
  if (!phoneInput) {
    return { isValid: false, formattedNumber: "", error: "Phone number is required" };
  }

  // Remove all non-digit characters
  const digitsOnly = String(phoneInput).replace(/\D/g, "");

  // Validate length
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return {
      isValid: false,
      formattedNumber: "",
      error: "Phone number must be between 10 and 15 digits",
    };
  }

  // Format based on length
  let formattedNumber: string;

  if (digitsOnly.length === 10) {
    // Indian format: add country code
    formattedNumber = `${COUNTRY_CODES[10]}${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    // Indian format with leading zero: replace with country code
    formattedNumber = `${COUNTRY_CODES[10]}${digitsOnly.slice(1)}`;
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    // Already has country code
    formattedNumber = digitsOnly;
  } else {
    // International format: use as-is
    formattedNumber = digitsOnly;
  }

  return { isValid: true, formattedNumber };
}

export function getWhatsAppUrl(
  phoneNumber: string,
  message: string
): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}