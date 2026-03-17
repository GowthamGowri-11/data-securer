/**
 * SHA-256 Hashing Module
 * 
 * This module provides cryptographic hashing functions using SHA-256 algorithm.
 * SHA-256 is a one-way hash function that produces a unique 256-bit (32-byte) hash value.
 * 
 * Use Cases:
 * - Data integrity verification
 * - Tamper detection
 * - Blockchain proof generation
 */

import crypto from 'crypto';

/**
 * Generate SHA-256 hash from input data
 * 
 * @param data - Input string to hash
 * @returns Hexadecimal string representation of SHA-256 hash
 * 
 * @example
 * const hash = generateHash("Hello World");
 * // Returns: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e"
 */
export function generateHash(data: string): string {
  try {
    // Create SHA-256 hash using Node.js crypto module
    const hash = crypto.createHash('sha256');
    
    // Update hash with input data
    hash.update(data, 'utf8');
    
    // Return hash as hexadecimal string
    return hash.digest('hex');
  } catch (error) {
    throw new Error(`Hash generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify if data matches a given hash
 * 
 * @param data - Original data to verify
 * @param hash - Expected hash value
 * @returns True if hash matches, false otherwise
 * 
 * @example
 * const isValid = verifyHash("Hello World", expectedHash);
 */
export function verifyHash(data: string, hash: string): boolean {
  try {
    const computedHash = generateHash(data);
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  } catch (error) {
    // If buffers have different lengths, comparison fails
    return false;
  }
}

/**
 * Generate hash for sensor data
 * 
 * Creates a deterministic hash by combining data type, value, and timestamp.
 * The format ensures consistent hashing for verification.
 * 
 * @param dataType - Type of sensor data (e.g., "Temperature", "Humidity")
 * @param dataValue - Actual sensor reading value
 * @param timestamp - Time when data was recorded
 * @returns SHA-256 hash of the combined data
 * 
 * @example
 * const hash = hashSensorData("Temperature", "25.5", new Date());
 */
export function hashSensorData(dataType: string, dataValue: string, timestamp: Date): string {
  try {
    // Create deterministic string format: dataType|dataValue|ISO8601_timestamp
    // Using pipe (|) as delimiter to separate fields clearly
    const dataString = `${dataType}|${dataValue}|${timestamp.toISOString()}`;
    
    return generateHash(dataString);
  } catch (error) {
    throw new Error(`Sensor data hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate hash for multiple data fields
 * 
 * Useful for hashing complex objects or multiple related data points.
 * 
 * @param fields - Array of string values to hash together
 * @returns SHA-256 hash of concatenated fields
 */
export function hashMultipleFields(fields: string[]): string {
  try {
    // Join fields with delimiter and hash
    const dataString = fields.join('|');
    return generateHash(dataString);
  } catch (error) {
    throw new Error(`Multi-field hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
