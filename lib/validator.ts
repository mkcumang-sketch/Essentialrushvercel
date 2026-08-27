// lib/validator.ts

/**
 * 🛡️ THE MASTER VALIDATOR UTILITY
 * Use these functions in your API routes to validate incoming data securely.
 */

export const Validator = {
    // 1. Validates standard Email formats
    isValidEmail: (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // 2. Validates Indian Mobile Numbers (10 digits, starting with 6-9)
    isValidIndianPhone: (phone: string): boolean => {
        const phoneRegex = /^[6-9]\d{9}$/;
        const cleanPhone = phone.replace(/\D/g, ''); // Remove spaces/dashes
        return phoneRegex.test(cleanPhone) || (cleanPhone.length === 12 && cleanPhone.startsWith('91'));
    },

    // 3. Password Strength (Min 8 chars, at least 1 letter and 1 number)
    isStrongPassword: (password: string): boolean => {
        return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
    },

    // 4. Validates URLs (For image/video links in Godmode)
    isValidUrl: (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch (err) {
            return false;
        }
    },

    // 5. Sanitizes input to prevent basic XSS attacks (Removes <script> tags)
    sanitizeText: (text: string): string => {
        if (!text) return "";
        return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                   .trim();
    },

    // 6. Validates Product Pricing (Must be positive numbers)
    isValidPrice: (price: any): boolean => {
        const num = Number(price);
        return !isNaN(num) && num >= 0;
    }
};