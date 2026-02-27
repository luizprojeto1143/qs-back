/**
 * Validation utilities for the server
 */

/**
 * Validates a Brazilian CNPJ number
 * @param cnpj - The CNPJ to validate (with or without formatting)
 * @returns true if valid, false otherwise
 */
export function isValidCNPJ(cnpj: string): boolean {
    // Remove all non-numeric characters
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    // Must have 14 digits
    if (cleanCNPJ.length !== 14) {
        return false;
    }

    // Check for all same digits (invalid)
    if (/^(\d)\1+$/.test(cleanCNPJ)) {
        return false;
    }

    // Validate check digits
    let sum = 0;
    let weight = 5;

    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleanCNPJ.charAt(i)) * weight;
        weight = weight === 2 ? 9 : weight - 1;
    }

    let remainder = sum % 11;
    let checkDigit1 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(cleanCNPJ.charAt(12)) !== checkDigit1) {
        return false;
    }

    sum = 0;
    weight = 6;

    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleanCNPJ.charAt(i)) * weight;
        weight = weight === 2 ? 9 : weight - 1;
    }

    remainder = sum % 11;
    let checkDigit2 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(cleanCNPJ.charAt(13)) !== checkDigit2) {
        return false;
    }

    return true;
}

/**
 * Validates a Brazilian CPF number
 * @param cpf - The CPF to validate (with or without formatting)
 * @returns true if valid, false otherwise
 */
export function isValidCPF(cpf: string): boolean {
    // Remove all non-numeric characters
    const cleanCPF = cpf.replace(/\D/g, '');

    // Must have 11 digits
    if (cleanCPF.length !== 11) {
        return false;
    }

    // Check for all same digits (invalid)
    if (/^(\d)\1+$/.test(cleanCPF)) {
        return false;
    }

    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
}

/**
 * Validates an email address
 * @param email - The email to validate
 * @returns true if valid format, false otherwise
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates a UUID v4
 * @param uuid - The UUID to validate
 * @returns true if valid, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Validates a date is not in the past
 * @param date - The date to validate
 * @returns true if date is today or in the future
 */
export function isNotPastDate(date: string | Date): boolean {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate >= today;
}

/**
 * Sanitizes a string to prevent XSS attacks
 * Basic HTML entity encoding
 * @param str - The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes HTML content to prevent XSS
 * More robust than describeString, removes scripts and dangerous attributes
 */
export function sanitizeHTML(str: string): string {
    if (!str) return '';
    return str
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '') // Remove script tags
        .replace(/on\w+="[^"]*"/gi, '') // Remove inline event handlers
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/data:/gi, '') // Remove data: URLs
        .replace(/</g, '&lt;') // Encode <
        .replace(/>/g, '&gt;'); // Encode >
}
