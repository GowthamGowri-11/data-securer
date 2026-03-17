/**
 * Data Integrity Verification Engine
 * 
 * This module implements the core tamper detection logic by comparing
 * database hashes with blockchain-stored hashes.
 * 
 * Verification Process:
 * 1. Read data from database
 * 2. Compute current hash of the data
 * 3. Retrieve original hash from blockchain
 * 4. Compare hashes to detect tampering
 * 5. Return verification result
 * 
 * Use Cases:
 * - Periodic integrity checks
 * - On-demand verification
 * - Automated tamper detection
 */

import { VerificationResult } from '@/types';
import { getSensorDataById, getAllSensorData } from '@/database/queries';
import { hashSensorData } from './hashing';
import { getDataFromBlockchain } from './blockchain-connector';
import { createAuditLog } from '@/database/queries';

/**
 * Verify integrity of a single data record
 * 
 * This is the core tamper detection function. It compares the current
 * database hash with the original hash stored on the blockchain.
 * 
 * Process:
 * 1. Fetch data from database
 * 2. Compute hash from current data
 * 3. Retrieve original hash from blockchain
 * 4. Compare hashes
 * 5. Log result
 * 
 * @param dataId - ID of the data record to verify
 * @returns Verification result with status and details
 * 
 * @example
 * const result = await verifyDataIntegrity("data-123");
 * if (!result.isValid) {
 *   console.log("Tampering detected!");
 *   // Trigger recovery process
 * }
 */
export async function verifyDataIntegrity(dataId: string): Promise<VerificationResult> {
  try {
    console.log(`[Verification] Starting integrity check for: ${dataId}`);
    
    // Step 1: Fetch data from database
    const dbData = await getSensorDataById(dataId);
    
    if (!dbData) {
      console.error(`[Verification] ✗ Data not found: ${dataId}`);
      return {
        isValid: false,
        dataId,
        databaseHash: '',
        blockchainHash: '',
        timestamp: new Date(),
        message: 'Data not found in database',
      };
    }
    
    // Step 2: Compute hash from current database data
    console.log('[Verification] Computing current hash...');
    const computedHash = hashSensorData(
      dbData.dataType,
      dbData.dataValue,
      dbData.timestamp
    );
    
    console.log(`[Verification] Current hash: ${computedHash.slice(0, 16)}...`);
    console.log(`[Verification] Stored hash:  ${dbData.hash.slice(0, 16)}...`);
    
    // Step 3: Retrieve original hash from blockchain
    console.log('[Verification] Fetching blockchain proof...');
    const blockchainProof = await getDataFromBlockchain(dbData.hash);
    
    if (!blockchainProof) {
      console.warn(`[Verification] ⚠ No blockchain proof found`);
      
      // Log verification event
      await createAuditLog({
        userId: dbData.userId,
        eventType: 'VERIFICATION_FAILED',
        dataId,
        details: 'No blockchain proof found for this data',
      });
      
      return {
        isValid: false,
        dataId,
        databaseHash: computedHash,
        blockchainHash: '',
        timestamp: new Date(),
        message: 'No blockchain proof found. Data may not have been properly stored.',
      };
    }
    
    const blockchainHash = blockchainProof.hash;
    
    // Step 4: Compare hashes
    const isValid = computedHash === blockchainHash;
    
    if (isValid) {
      console.log('[Verification] ✓ Data integrity verified - No tampering detected');
      
      // Log successful verification
      await createAuditLog({
        userId: dbData.userId,
        eventType: 'VERIFICATION_PASSED',
        dataId,
        details: 'Data integrity verified successfully',
      });
      
      return {
        isValid: true,
        dataId,
        databaseHash: computedHash,
        blockchainHash,
        timestamp: new Date(),
        message: 'Data integrity verified. No tampering detected.',
      };
    } else {
      console.error('[Verification] ✗ TAMPERING DETECTED!');
      console.error(`[Verification] Expected: ${blockchainHash.slice(0, 16)}...`);
      console.error(`[Verification] Got:      ${computedHash.slice(0, 16)}...`);
      
      // Log tampering detection
      await createAuditLog({
        userId: dbData.userId,
        eventType: 'TAMPER_DETECTED',
        dataId,
        details: `Hash mismatch detected. Database hash: ${computedHash.slice(0, 20)}..., Blockchain hash: ${blockchainHash.slice(0, 20)}...`,
      });
      
      return {
        isValid: false,
        dataId,
        databaseHash: computedHash,
        blockchainHash,
        timestamp: new Date(),
        message: 'TAMPERING DETECTED! Database hash does not match blockchain hash.',
      };
    }
  } catch (error) {
    console.error('[Verification] ✗ Verification error:', error);
    
    return {
      isValid: false,
      dataId,
      databaseHash: '',
      blockchainHash: '',
      timestamp: new Date(),
      message: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Verify integrity of all data records
 * 
 * Performs batch verification of all records in the database.
 * Useful for periodic system-wide integrity checks.
 * 
 * @param userId - Filter by user ID (optional, admin sees all if not provided)
 * @returns Array of verification results for all records
 * 
 * @example
 * const results = await verifyAllData();
 * const tamperedRecords = results.filter(r => !r.isValid);
 * console.log(`Found ${tamperedRecords.length} tampered records`);
 */
export async function verifyAllData(userId?: string): Promise<VerificationResult[]> {
  try {
    console.log(`[Verification] Starting batch verification for ${userId ? `user ${userId}` : 'all users'}...`);
    
    // Fetch all data records (filtered by userId if provided)
    const allData = await getAllSensorData(100, 0, userId);
    
    console.log(`[Verification] Verifying ${allData.length} records...`);
    
    // Verify each record
    const results: VerificationResult[] = [];
    
    for (const data of allData) {
      const result = await verifyDataIntegrity(data.id);
      results.push(result);
    }
    
    // Summary
    const validCount = results.filter(r => r.isValid).length;
    const tamperedCount = results.filter(r => !r.isValid).length;
    
    console.log('[Verification] Batch verification complete:');
    console.log(`[Verification] ✓ Valid: ${validCount}`);
    console.log(`[Verification] ✗ Tampered: ${tamperedCount}`);
    
    return results;
  } catch (error) {
    console.error('[Verification] ✗ Batch verification error:', error);
    throw new Error(`Batch verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Quick integrity check (hash comparison only)
 * 
 * Faster verification that only compares stored hash with computed hash,
 * without blockchain lookup. Useful for quick checks.
 * 
 * @param dataId - ID of the data record
 * @returns True if hashes match, false otherwise
 */
export async function quickIntegrityCheck(dataId: string): Promise<boolean> {
  try {
    const dbData = await getSensorDataById(dataId);
    
    if (!dbData) {
      return false;
    }
    
    const computedHash = hashSensorData(
      dbData.dataType,
      dbData.dataValue,
      dbData.timestamp
    );
    
    return computedHash === dbData.hash;
  } catch (error) {
    console.error('[Verification] Quick check error:', error);
    return false;
  }
}

/**
 * Get verification statistics
 * 
 * @returns Statistics about verification history
 */
export async function getVerificationStats(): Promise<{
  totalRecords: number;
  lastVerification: Date | null;
  tamperedCount: number;
}> {
  try {
    const allData = await getAllSensorData();
    
    // In a real system, you'd query audit logs for this info
    return {
      totalRecords: allData.length,
      lastVerification: null, // Would come from audit logs
      tamperedCount: 0, // Would come from audit logs
    };
  } catch (error) {
    return {
      totalRecords: 0,
      lastVerification: null,
      tamperedCount: 0,
    };
  }
}

/**
 * Schedule periodic verification
 * 
 * Sets up automatic verification at specified intervals.
 * 
 * @param intervalMinutes - How often to run verification (in minutes)
 * @returns Timer ID that can be used to cancel the schedule
 * 
 * @example
 * // Verify every 30 minutes
 * const timerId = schedulePeriodicVerification(30);
 * 
 * // Later, to cancel:
 * clearInterval(timerId);
 */
export function schedulePeriodicVerification(intervalMinutes: number): NodeJS.Timeout {
  console.log(`[Verification] Scheduling periodic verification every ${intervalMinutes} minutes`);
  
  const intervalMs = intervalMinutes * 60 * 1000;
  
  const timerId = setInterval(async () => {
    console.log('[Verification] Running scheduled verification...');
    try {
      const results = await verifyAllData();
      const tamperedCount = results.filter(r => !r.isValid).length;
      
      if (tamperedCount > 0) {
        console.error(`[Verification] ⚠ ALERT: ${tamperedCount} tampered records detected!`);
        // In production, trigger alerts/notifications here
      }
    } catch (error) {
      console.error('[Verification] Scheduled verification failed:', error);
    }
  }, intervalMs);
  
  return timerId;
}
