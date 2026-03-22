/**
 * Data Service
 * 
 * High-level service for managing sensor data operations.
 * Orchestrates hashing, encryption, blockchain storage, and database operations.
 */

import { SensorData } from '@/types';
import { saveSensorData, getAllSensorData } from '@/database/queries';
import { hashSensorData } from '@/lib/hashing';
import { encryptSensorData } from '@/lib/encryption';
import { storeDataOnBlockchain } from '@/lib/blockchain-connector';
import { createAuditLog } from '@/database/queries';

/**
 * Submit sensor data with full security pipeline
 * 
 * Process:
 * 1. Generate SHA-256 hash
 * 2. Encrypt data with AES-256
 * 3. Store proof on blockchain
 * 4. Save to database
 * 5. Log submission event
 * 
 * @param userId - ID of the user submitting the data
 * @param dataType - Type of sensor data
 * @param dataValue - Sensor reading value
 * @param timestamp - Time of reading
 * @returns Created sensor data record
 */
export async function submitSensorData(
  userId: string,
  dataType: string,
  dataValue: string,
  timestamp: Date
): Promise<SensorData> {
  try {
    // console.log(`[DataService] Submitting sensor data for user ${userId}: ${dataType} = ${dataValue}`);
    
    // Step 1: Generate SHA-256 hash
    // console.log('[DataService] Generating hash...');
    const hash = hashSensorData(dataType, dataValue, timestamp);
    // console.log(`[DataService] Hash: ${hash.slice(0, 16)}...`);
    
    // Step 2: Encrypt data with AES-256
    // console.log('[DataService] Encrypting data...');
    const encryptedData = encryptSensorData(dataType, dataValue, timestamp);
    // console.log('[DataService] Data encrypted');
    
    // Step 3: Store proof on blockchain
    // console.log('[DataService] Storing on blockchain...');
    const txHash = await storeDataOnBlockchain(hash, encryptedData, timestamp.getTime());
    // console.log(`[DataService] Blockchain TX: ${txHash.slice(0, 16)}...`);
    
    // Step 4: Save to database
    // console.log('[DataService] Saving to database...');
    const data = await saveSensorData({
      userId,
      dataType,
      dataValue,
      timestamp,
      hash,
      encryptedData,
      blockchainTxHash: txHash,
    });
    
    // Step 5: Log submission event with hash
    await createAuditLog({
      userId,
      eventType: 'DATA_SUBMITTED',
      dataId: data.id,
      details: `Sensor data submitted: ${dataType} = ${dataValue}. Hash: ${hash}. Blockchain TX: ${txHash}`,
    });
    
    console.log('[DataService] ✓ Data submitted successfully');
    
    return data as SensorData;
  } catch (error) {
    console.error('[DataService] ✗ Submission failed:', error);
    throw new Error(`Data submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch all sensor data records
 * 
 * @param userId - Filter by user ID (optional, admin sees all if not provided)
 * @returns Array of all sensor data
 */
export async function fetchAllSensorData(userId?: string): Promise<SensorData[]> {
  try {
    const data = await getAllSensorData(100, 0, userId);
    return data as SensorData[];
  } catch (error) {
    console.error('[DataService] ✗ Fetch failed:', error);
    throw new Error(`Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
