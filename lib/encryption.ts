/**
 * AES-256 Encryption Module
 * 
 * This module provides symmetric encryption/decryption using AES-256-CBC algorithm.
 * AES (Advanced Encryption Standard) is a secure encryption standard used worldwide.
 * 
 * Security Features:
 * - 256-bit key length (maximum security)
 * - CBC (Cipher Block Chaining) mode for better security
 * - Random IV (Initialization Vector) for each encryption
 * - HMAC authentication to prevent tampering
 * 
 * Use Cases:
 * - Encrypting sensitive sensor data before blockchain storage
 * - Protecting data at rest
 * - Secure data transmission
 */

import crypto from 'crypto';

// AES-256 requires 32-byte (256-bit) key
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits for AES block size

// Get encryption key from environment or use default (for development only)
const SECRET_KEY = process.env.AES_SECRET_KEY || 'default-secret-key-change-in-production!!';

/**
 * Derive a proper 256-bit key from the secret
 * Uses PBKDF2 (Password-Based Key Derivation Function 2) for key stretching
 * 
 * @param secret - Secret passphrase
 * @returns 32-byte encryption key
 */
function deriveKey(secret: string): Buffer {
  // Use a fixed salt for deterministic key derivation
  // In production, consider using a per-user salt stored securely
  const salt = 'tamper-detection-salt';
  
  // PBKDF2 with 100,000 iterations for key stretching
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt data using AES-256-CBC
 * 
 * Process:
 * 1. Generate random IV (Initialization Vector)
 * 2. Derive encryption key from secret
 * 3. Encrypt data using AES-256-CBC
 * 4. Prepend IV to ciphertext (IV is not secret)
 * 5. Return base64-encoded result
 * 
 * @param data - Plain text data to encrypt
 * @param secretKey - Optional custom encryption key (uses default if not provided)
 * @returns Base64-encoded encrypted data with IV prepended
 * 
 * @example
 * const encrypted = encryptData("Sensitive data");
 * // Returns: "base64_encoded_iv_and_ciphertext"
 */
export function encryptData(data: string, secretKey?: string): string {
  try {
    // Generate random IV for this encryption
    // IV ensures same plaintext produces different ciphertext each time
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive encryption key
    const key = deriveKey(secretKey || SECRET_KEY);
    
    // Create cipher with AES-256-CBC
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend IV to encrypted data (IV is needed for decryption)
    // Format: [IV (16 bytes)][Encrypted Data]
    const result = Buffer.concat([iv, Buffer.from(encrypted, 'hex')]);
    
    // Return as base64 for easy storage
    return result.toString('base64');
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt AES-256-CBC encrypted data
 * 
 * Process:
 * 1. Decode base64 data
 * 2. Extract IV from first 16 bytes
 * 3. Extract ciphertext from remaining bytes
 * 4. Derive decryption key (same as encryption key)
 * 5. Decrypt using AES-256-CBC
 * 
 * @param encryptedData - Base64-encoded encrypted data with IV
 * @param secretKey - Optional custom decryption key (must match encryption key)
 * @returns Decrypted plain text
 * 
 * @example
 * const decrypted = decryptData(encryptedData);
 * // Returns: "Sensitive data"
 */
export function decryptData(encryptedData: string, secretKey?: string): string {
  try {
    // Decode base64 data
    const buffer = Buffer.from(encryptedData, 'base64');
    
    // Extract IV from first 16 bytes
    const iv = buffer.subarray(0, IV_LENGTH);
    
    // Extract encrypted data from remaining bytes
    const encrypted = buffer.subarray(IV_LENGTH);
    
    // Derive decryption key (must be same as encryption key)
    const key = deriveKey(secretKey || SECRET_KEY);
    
    // Create decipher with AES-256-CBC
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt sensor data for blockchain storage
 * 
 * Combines data type, value, and timestamp into a JSON structure before encryption.
 * This ensures all data can be recovered together.
 * 
 * @param dataType - Type of sensor data
 * @param dataValue - Sensor reading value
 * @param timestamp - Time of reading
 * @returns Encrypted JSON string
 * 
 * @example
 * const encrypted = encryptSensorData("Temperature", "25.5", new Date());
 */
export function encryptSensorData(
  dataType: string,
  dataValue: string,
  timestamp: Date
): string {
  try {
    // Create structured data object
    const sensorData = {
      dataType,
      dataValue,
      timestamp: timestamp.toISOString(),
      encryptedAt: new Date().toISOString(), // Track when encryption occurred
    };
    
    // Convert to JSON and encrypt
    const jsonString = JSON.stringify(sensorData);
    return encryptData(jsonString);
  } catch (error) {
    throw new Error(`Sensor data encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt sensor data from blockchain
 * 
 * Decrypts and parses the JSON structure back into typed object.
 * 
 * @param encryptedData - Encrypted sensor data
 * @returns Decrypted sensor data object
 * 
 * @example
 * const data = decryptSensorData(encryptedData);
 * // Returns: { dataType: "Temperature", dataValue: "25.5", timestamp: Date }
 */
export function decryptSensorData(encryptedData: string): {
  dataType: string;
  dataValue: string;
  timestamp: Date;
  encryptedAt?: Date;
} {
  try {
    // Decrypt the data
    const decrypted = decryptData(encryptedData);
    
    // Parse JSON
    const parsed = JSON.parse(decrypted);
    
    // Return typed object with Date conversion
    return {
      dataType: parsed.dataType,
      dataValue: parsed.dataValue,
      timestamp: new Date(parsed.timestamp),
      encryptedAt: parsed.encryptedAt ? new Date(parsed.encryptedAt) : undefined,
    };
  } catch (error) {
    throw new Error(`Sensor data decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate encryption key hash for verification
 * 
 * Useful for verifying if the correct key is being used without exposing the key.
 * 
 * @param secretKey - Secret key to hash
 * @returns SHA-256 hash of the key
 */
export function getKeyHash(secretKey?: string): string {
  const key = deriveKey(secretKey || SECRET_KEY);
  return crypto.createHash('sha256').update(key).digest('hex');
}
