import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// AES-256-GCM encryption for Plaid access tokens
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For GCM mode

/**
 * Encrypts a string using AES-256-GCM
 * @param text - The plain text to encrypt
 * @param key - 32-byte hex encryption key
 * @returns Encrypted string in format: iv:authTag:encryptedData (all hex)
 */
export function encrypt(text: string, key: string): string {
  if (!key || key.length !== 64) {
    throw new Error(
      "Encryption key must be a 32-byte hex string (64 characters)"
    );
  }

  const keyBuffer = Buffer.from(key, "hex");
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return format: iv:authTag:encryptedData
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a string encrypted with the encrypt function
 * @param encryptedText - Encrypted string in format: iv:authTag:encryptedData
 * @param key - 32-byte hex encryption key (same as used for encryption)
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string, key: string): string {
  if (!key || key.length !== 64) {
    throw new Error(
      "Encryption key must be a 32-byte hex string (64 characters)"
    );
  }

  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }

  const [ivHex, authTagHex, encryptedData] = parts;
  const keyBuffer = Buffer.from(key, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Validates that the encryption key is properly configured
 * @throws Error if key is not configured or invalid
 */
export function validateEncryptionKey(): void {
  const key = process.env.PLAID_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "PLAID_ENCRYPTION_KEY environment variable is not set. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  if (key.length !== 64) {
    throw new Error(
      "PLAID_ENCRYPTION_KEY must be a 32-byte hex string (64 characters). " +
        "Current length: " +
        key.length
    );
  }

  // Test encryption/decryption
  try {
    const testText = "test";
    const encrypted = encrypt(testText, key);
    const decrypted = decrypt(encrypted, key);
    if (decrypted !== testText) {
      throw new Error("Encryption/decryption test failed");
    }
  } catch (error) {
    throw new Error(
      "Encryption key validation failed: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
}
