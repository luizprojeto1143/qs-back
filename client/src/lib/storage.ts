// Simple secure storage wrapper to prevent plain text exposure
const ENCRYPTION_KEY = 'qs-inclusao-secure-key'; // In prod this should be env var

const encrypt = (data: string): string => {
    // Basic XOR obfuscation
    const textToChars = (text: string) => text.split('').map(c => c.charCodeAt(0));
    const byteHex = (n: number) => ("0" + Number(n).toString(16)).substr(-2);
    const applySaltToChar = (code: number) => textToChars(ENCRYPTION_KEY).reduce((a, b) => a ^ b, code);

    return textToChars(data)
        .map(applySaltToChar)
        .map(byteHex)
        .join('');
};

const decrypt = (encoded: string): string => {
    const textToChars = (text: string) => text.split('').map(c => c.charCodeAt(0));
    const applySaltToChar = (code: number) => textToChars(ENCRYPTION_KEY).reduce((a, b) => a ^ b, code);

    return (encoded.match(/.{1,2}/g) || [])
        .map(hex => parseInt(hex, 16))
        .map(applySaltToChar)
        .map(charCode => String.fromCharCode(charCode))
        .join('');
};

export const storage = {
    set: (key: string, value: any) => {
        try {
            const stringValue = JSON.stringify(value);
            const encrypted = encrypt(stringValue);
            localStorage.setItem(key, encrypted);
        } catch (error) {
            console.error('Error saving to storage', error);
        }
    },
    get: (key: string) => {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;
            const decrypted = decrypt(encrypted);
            return JSON.parse(decrypted);
        } catch {
            return null;
        }
    },
    remove: (key: string) => {
        localStorage.removeItem(key);
    }
};
