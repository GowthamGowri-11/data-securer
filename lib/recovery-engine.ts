/**
 * Data Recovery Engine
 * 
 * This module implements automatic data recovery from blockchain when
 * tampering is detected. It retrieves encrypted data from blockchain,
 * decrypts it, and restores the original data to the database.
 * 
 * Recovery Process:
 * 1. Detect tampering (via verification engine)
 * 2. Retrieve encrypted data from blockchain
 * 3. Decrypt the data using AES
 * 4. Verify decrypted data integrity
 * 5. Restore data to database
 * 6. Log recovery event
 * 
 * Use Cases:
 * - Automatic recovery after tamper detection
 * - Manual recovery triggered by admin
 * - Disaster recovery scenarios
 */

import { RecoveryResult, SensorData } from '@/types';
import { getSensorDataById, updateSensorData, createAuditLog } from '@/database/queries';
import { getDataFromBlockchain } from './blockchain-connector';
import { decryptSensorData } from './encryption';
import { hashSensorData } from './hashing';
import { verifyDataIntegrity } from './verification-engine';

/**
 * Recover tampered data from blockchain
 * 
 * This is the main recovery function that restores original data
 * when tampering is detected OR when data is completely deleted.
 * 
 * Process:
 * 1. Check if data exists in database
 * 2. If deleted: Recreate from blockchain
 * 3. If tampered: Update with blockchain data
 * 4. Decrypt the data
 * 5. Verify decrypted data integrity
 * 6. Restore/Create database record
 * 7. Log recovery event
 * 
 * @param dataId - ID of the tampered/deleted data record
 * @returns Recovery result with status and recovered data
 * 
 * @example
 * const result = await recoverData("data-123");
 * if (result.success) {
 *   console.log("Data recovered successfully!");
 * }
 */
export async function recoverData(dataId: string): Promise<RecoveryResult> {
  try {
    console.log(`[Recovery] Starting recovery process for: ${dataId}`);
    
    // Step 1: Get current database record (might be null if deleted)
    const dbData = await getSensorDataById(dataId);
    
    // Handle DELETED data scenario
    if (!dbData) {
      console.warn(`[Recovery] ⚠️ Data not found in database - attempting recovery from blockchain...`);
      return await recoverDeletedData(dataId);
    }
    
    // Handle TAMPERED data scenario (existing record)
    // Step 2: Verify that tampering actually occurred
    console.log('[Recovery] Verifying tampering...');
    const verificationResult = await verifyDataIntegrity(dataId);
    
    if (verificationResult.isValid) {
      console.log('[Recovery] ⚠ No tampering detected. Recovery not needed.');
      return {
        success: false,
        dataId,
        recoveredData: null,
        message: 'No tampering detected. Data is already valid.',
      };
    }
    
    console.log('[Recovery] ✓ Tampering confirmed. Proceeding with recovery...');
    
    // Step 3: Retrieve encrypted data from blockchain using the ORIGINAL hash
    console.log('[Recovery] Retrieving encrypted data from blockchain...');
    const blockchainProof = await getDataFromBlockchain(verificationResult.blockchainHash);
    
    if (!blockchainProof) {
      console.error('[Recovery] ✗ No blockchain proof found');
      return {
        success: false,
        dataId,
        recoveredData: null,
        message: 'Cannot recover: No blockchain proof found',
      };
    }
    
    console.log('[Recovery] ✓ Blockchain proof retrieved');
    
    // Step 4: Decrypt the data
    console.log('[Recovery] Decrypting data...');
    let decryptedData;
    
    try {
      decryptedData = decryptSensorData(blockchainProof.encryptedData);
      console.log('[Recovery] ✓ Data decrypted successfully');
    } catch (error) {
      console.error('[Recovery] ✗ Decryption failed:', error);
      return {
        success: false,
        dataId,
        recoveredData: null,
        message: `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
    
    // Step 5: Verify decrypted data integrity
    console.log('[Recovery] Verifying decrypted data...');
    const recoveredHash = hashSensorData(
      decryptedData.dataType,
      decryptedData.dataValue,
      decryptedData.timestamp
    );
    
    if (recoveredHash !== blockchainProof.hash) {
      console.error('[Recovery] ✗ Decrypted data hash mismatch!');
      return {
        success: false,
        dataId,
        recoveredData: null,
        message: 'Recovery failed: Decrypted data integrity check failed',
      };
    }
    
    console.log('[Recovery] ✓ Decrypted data verified');
    
    // Step 6: Update database with recovered data
    console.log('[Recovery] Restoring data to database...');
    
    try {
      await updateSensorData(dataId, {
        dataType: decryptedData.dataType,
        dataValue: decryptedData.dataValue,
        timestamp: decryptedData.timestamp,
        hash: recoveredHash,
        encryptedData: blockchainProof.encryptedData,
      });
      
      console.log('[Recovery] ✓ Database updated with recovered data');
    } catch (error) {
      console.error('[Recovery] ✗ Database update failed:', error);
      return {
        success: false,
        dataId,
        recoveredData: null,
        message: `Database update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
    
    // Step 7: Log recovery event
    await createAuditLog({
      userId: dbData.userId,
      eventType: 'RECOVERY_SUCCESS',
      dataId,
      details: `Data successfully recovered from blockchain. Original hash: ${recoveredHash.slice(0, 20)}...`,
    });
    
    console.log('[Recovery] ✓✓✓ RECOVERY COMPLETE ✓✓✓');
    
    // Return success with recovered data
    return {
      success: true,
      dataId,
      recoveredData: {
        id: dataId,
        userId: dbData.userId,
        dataType: decryptedData.dataType,
        dataValue: decryptedData.dataValue,
        timestamp: decryptedData.timestamp,
        hash: recoveredHash,
        encryptedData: blockchainProof.encryptedData,
        createdAt: dbData.createdAt,
      },
      message: 'Data recovered successfully from blockchain',
    };
  } catch (error) {
    console.error('[Recovery] ✗ Recovery error:', error);
    
    // Get userId from dbData if available
    const dbData = await getSensorDataById(dataId).catch(() => null);
    
    // Log failed recovery attempt
    await createAuditLog({
      userId: dbData?.userId || 'unknown',
      eventType: 'RECOVERY_FAILED',
      dataId,
      details: `Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    
    return {
      success: false,
      dataId,
      recoveredData: null,
      message: `Recovery error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Recover DELETED data from blockchain
 * 
 * This function handles the case where data has been completely deleted
 * from the database. It recreates the record from blockchain data.
 * 
 * Process:
 * 1. Find the original hash from audit logs
 * 2. Query blockchain using the hash
 * 3. Decrypt the blockchain data
 * 4. Verify data integrity
 * 5. CREATE new database record with original ID
 * 6. Log recovery event
 * 
 * @param dataId - ID of the deleted data record
 * @returns Recovery result with recreated data
 */
async function recoverDeletedData(dataId: string): Promise<RecoveryResult> {
  try {
    console.log(`[Recovery] ⚠️ DELETED DATA RECOVERY: ${dataId}`);
    console.log('[Recovery] Data not found in database - attempting blockchain recovery...');
    
    // Import required functions
    const { getAuditLogsByDataId, saveSensorData } = await import('@/database/queries');
    const { prisma } = await import('@/database/client');
    
    // Step 1: Find audit logs for this data ID
    console.log('[Recovery] Step 1: Searching audit logs...');
    const auditLogs = await getAuditLogsByDataId(dataId);
    
    if (auditLogs.length === 0) {
      console.error('[Recovery] ✗ No audit logs found');
      return {
        success: false,
        dataId,
        recoveredData: null,
        message: 'Cannot recover deleted data: No audit trail found. Data may have been deleted before blockchain storage.',
      };
    }
    
    console.log(`[Recovery] ✓ Found ${auditLogs.length} audit log entries`);
    
    // Step 2: Extract hash from audit logs
    console.log('[Recovery] Step 2: Extracting blockchain hash...');
    let originalHash: string | null = null;
    
    // Look for hash in DATA_SUBMITTED events
    for (const log of auditLogs) {
      if (log.eventType === 'DATA_SUBMITTED') {
        // Try to extract hash from details
        // Format: "Hash: abc123..." or "Blockchain hash: abc123..."
        const hashMatch = log.details.match(/[Hh]ash:\s*([a-f0-9]{64})/);
        if (hashMatch) {
          originalHash = hashMatch[1];
          break;
        }
        
        // Also try to find any 64-character hex string (SHA-256 hash)
        const hexMatch = log.details.match(/\b([a-f0-9]{64})\b/);
        if (hexMatch) {
          originalHash = hexMatch[1];
          break;
        }
      }
    }
    
    if (!originalHash) {
      console.error('[Recovery] ✗ Could not extract hash from audit logs');
      console.log('[Recovery] Audit log details:', auditLogs.map(l => l.details));
      return {
        success: false,
        dataId,
        recoveredData: null,
        message: 'Cannot recover: Original data hash not found in audit logs. The hash is required to query blockchain.',
      };
    }
    
    console.log(`[Recovery] ✓ Found original hash: ${originalHash.slice(0, 16)}...`);
    
    // Step 3: Retrieve data from blockchain
    console.log('[Recovery] Step 3: Querying blockchain...');
    const blockchainProof = await getDataFromBlockchain(originalHash);
    
    if (!blockchainProof) {
      console.error('[Recovery] ✗ Data not found on blockchain');
      return {
        success: false,
        dataId,
        recoveredData: null,
        message: `Cannot recover: Data with hash ${originalHash.slice(0, 16)}... not found on blockchain. It may not have been stored successfully.`,
      };
    }
    
    console.log('[Recovery] ✓ Blockchain data retrieved successfully');
    
    // Step 4: Decrypt the data
    console.log('[Recovery] Step 4: Decrypting data...');
    let decryptedData;
    
    try {
      decryptedData = decryptSensorData(blockchainProof.encryptedData);
      console.log('[Recovery] ✓ Data decrypted successfully');
    } catch (error) {
      console.error('[Recovery] ✗ Decryption failed:', error);
      return {
        success: false,
        dataId,
        recoveredData: null,
        message: `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
    
    // Step 5: Verify decrypted data integrity
    console.log('[Recovery] Step 5: Verifying data integrity...');
    const recoveredHash = hashSensorData(
      decryptedData.dataType,
      decryptedData.dataValue,
      decryptedData.timestamp
    );
    
    if (recoveredHash !== blockchainProof.hash) {
      console.error('[Recovery] ✗ Hash mismatch after decryption!');
      console.error(`[Recovery] Expected: ${blockchainProof.hash.slice(0, 16)}...`);
      console.error(`[Recovery] Got:      ${recoveredHash.slice(0, 16)}...`);
      return {
        success: false,
        dataId,
        recoveredData: null,
        message: 'Recovery failed: Decrypted data integrity check failed',
      };
    }
    
    console.log('[Recovery] ✓ Data integrity verified');
    
    // Step 6: Recreate database record with ORIGINAL ID
    console.log('[Recovery] Step 6: Recreating database record...');
    
    try {
      // Use Prisma to create record with specific ID
      const recreatedRecord = await prisma.sensorData.create({
        data: {
          id: dataId, // Use the original ID
          userId: 'system', // Deleted data recovery - no original user context
          dataType: decryptedData.dataType,
          dataValue: decryptedData.dataValue,
          timestamp: decryptedData.timestamp,
          hash: recoveredHash,
          encryptedData: blockchainProof.encryptedData,
          blockchainTxHash: blockchainProof.transactionHash || 'recovered',
        },
      });
      
      console.log('[Recovery] ✓ Database record recreated with original ID');
    } catch (error) {
      console.error('[Recovery] ✗ Database recreation failed:', error);
      return {
        success: false,
        dataId,
        recoveredData: null,
        message: `Failed to recreate database record: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
    
    // Step 7: Log successful recovery
    await createAuditLog({
      userId: 'system', // Deleted data recovery - no user context
      eventType: 'DELETED_DATA_RECOVERED',
      dataId,
      details: `Deleted data successfully recovered from blockchain. Original hash: ${recoveredHash.slice(0, 20)}... Record recreated with original ID.`,
    });
    
    console.log('[Recovery] ✓✓✓ DELETED DATA RECOVERY COMPLETE ✓✓✓');
    console.log(`[Recovery] Record ${dataId} has been fully restored from blockchain`);
    
    // Return success with recovered data
    return {
      success: true,
      dataId,
      recoveredData: {
        id: dataId,
        userId: 'system', // Deleted data recovery - no original user context
        dataType: decryptedData.dataType,
        dataValue: decryptedData.dataValue,
        timestamp: decryptedData.timestamp,
        hash: recoveredHash,
        encryptedData: blockchainProof.encryptedData,
        createdAt: new Date(), // New creation time
      },
      message: 'Deleted data successfully recovered and restored from blockchain',
    };
  } catch (error) {
    console.error('[Recovery] ✗ Deleted data recovery error:', error);
    
    // Log failed recovery attempt
    await createAuditLog({
      userId: 'system', // Deleted data recovery - no user context
      eventType: 'DELETED_DATA_RECOVERY_FAILED',
      dataId,
      details: `Failed to recover deleted data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    
    return {
      success: false,
      dataId,
      recoveredData: null,
      message: `Failed to recover deleted data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Recover multiple tampered records
 * 
 * Batch recovery for multiple tampered records.
 * 
 * @param dataIds - Array of data IDs to recover
 * @returns Array of recovery results
 * 
 * @example
 * const results = await recoverMultipleRecords(["data-1", "data-2"]);
 * const successCount = results.filter(r => r.success).length;
 */
export async function recoverMultipleRecords(dataIds: string[]): Promise<RecoveryResult[]> {
  console.log(`[Recovery] Starting batch recovery for ${dataIds.length} records...`);
  
  const results: RecoveryResult[] = [];
  
  for (const dataId of dataIds) {
    const result = await recoverData(dataId);
    results.push(result);
    
    // Small delay between recoveries to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log('[Recovery] Batch recovery complete:');
  console.log(`[Recovery] ✓ Successful: ${successCount}`);
  console.log(`[Recovery] ✗ Failed: ${failCount}`);
  
  return results;
}

/**
 * Auto-recover all tampered records
 * 
 * Automatically detects and recovers all tampered records in the system.
 * This is useful for automated recovery processes.
 * 
 * @param userId - Filter by user ID (optional, admin sees all if not provided)
 * @returns Recovery results for all tampered records
 * 
 * @example
 * const results = await autoRecoverAll();
 */
export async function autoRecoverAll(userId?: string): Promise<RecoveryResult[]> {
  try {
    console.log(`[Recovery] Starting auto-recovery process for ${userId ? `user ${userId}` : 'all users'}...`);
    
    // Import verification function
    const { verifyAllData } = require('./verification-engine');
    
    // Step 1: Verify all data to find tampered records (filtered by userId if provided)
    console.log('[Recovery] Scanning for tampered records...');
    const verificationResults = await verifyAllData(userId);
    
    // Step 2: Filter tampered records
    const tamperedRecords = verificationResults.filter((r: any) => !r.isValid);
    
    if (tamperedRecords.length === 0) {
      console.log('[Recovery] ✓ No tampered records found');
      return [];
    }
    
    console.log(`[Recovery] Found ${tamperedRecords.length} tampered records`);
    
    // Step 3: Recover all tampered records
    const dataIds = tamperedRecords.map((r: any) => r.dataId);
    const results = await recoverMultipleRecords(dataIds);
    
    return results;
  } catch (error) {
    console.error('[Recovery] Auto-recovery error:', error);
    throw new Error(`Auto-recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Preview recovery (dry run)
 * 
 * Shows what would be recovered without actually modifying the database.
 * Useful for verification before actual recovery.
 * 
 * @param dataId - ID of the data record
 * @returns Preview of what would be recovered
 */
export async function previewRecovery(dataId: string): Promise<{
  canRecover: boolean;
  currentData: any;
  recoveredData: any;
  message: string;
}> {
  try {
    console.log(`[Recovery] Previewing recovery for: ${dataId}`);
    
    const dbData = await getSensorDataById(dataId);
    
    if (!dbData) {
      return {
        canRecover: false,
        currentData: null,
        recoveredData: null,
        message: 'Data not found',
      };
    }
    
    const verificationResult = await verifyDataIntegrity(dataId);
    
    if (verificationResult.isValid) {
      return {
        canRecover: false,
        currentData: dbData,
        recoveredData: null,
        message: 'No tampering detected',
      };
    }
    
    const blockchainProof = await getDataFromBlockchain(verificationResult.blockchainHash);
    
    if (!blockchainProof) {
      return {
        canRecover: false,
        currentData: dbData,
        recoveredData: null,
        message: 'No blockchain proof available',
      };
    }
    
    const decryptedData = decryptSensorData(blockchainProof.encryptedData);
    
    return {
      canRecover: true,
      currentData: {
        dataType: dbData.dataType,
        dataValue: dbData.dataValue,
        timestamp: dbData.timestamp,
      },
      recoveredData: {
        dataType: decryptedData.dataType,
        dataValue: decryptedData.dataValue,
        timestamp: decryptedData.timestamp,
      },
      message: 'Recovery possible',
    };
  } catch (error) {
    return {
      canRecover: false,
      currentData: null,
      recoveredData: null,
      message: `Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get recovery statistics
 * 
 * @returns Statistics about recovery operations
 */
export async function getRecoveryStats(): Promise<{
  totalRecoveries: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  lastRecovery: Date | null;
}> {
  // In a real system, this would query audit logs
  return {
    totalRecoveries: 0,
    successfulRecoveries: 0,
    failedRecoveries: 0,
    lastRecovery: null,
  };
}
