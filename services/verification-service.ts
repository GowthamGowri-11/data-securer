/**
 * Verification Service
 * 
 * High-level service for data integrity verification operations.
 * Provides a clean API for the frontend to trigger verification checks.
 */

import { VerificationResult } from '@/types';
import { 
  verifyDataIntegrity, 
  verifyAllData, 
  quickIntegrityCheck,
  getVerificationStats,
  schedulePeriodicVerification
} from '@/lib/verification-engine';

/**
 * Verify a single data record
 * 
 * @param dataId - ID of the data to verify
 * @returns Verification result
 */
export async function verifySingleRecord(dataId: string): Promise<VerificationResult> {
  try {
    console.log(`[VerificationService] Verifying record: ${dataId}`);
    return await verifyDataIntegrity(dataId);
  } catch (error) {
    console.error('[VerificationService] Verification failed:', error);
    throw error;
  }
}

/**
 * Verify all records in the system
 * 
 * @param userId - Filter by user ID (optional, admin sees all if not provided)
 * @returns Array of verification results
 */
export async function verifyAllRecords(userId?: string): Promise<VerificationResult[]> {
  try {
    console.log(`[VerificationService] Starting full system verification for ${userId ? `user ${userId}` : 'all users'}...`);
    return await verifyAllData(userId);
  } catch (error) {
    console.error('[VerificationService] Batch verification failed:', error);
    throw error;
  }
}

/**
 * Quick check without blockchain lookup
 * 
 * @param dataId - ID of the data to check
 * @returns True if valid, false otherwise
 */
export async function quickCheck(dataId: string): Promise<boolean> {
  try {
    return await quickIntegrityCheck(dataId);
  } catch (error) {
    console.error('[VerificationService] Quick check failed:', error);
    return false;
  }
}

/**
 * Get verification statistics
 * 
 * @returns Verification stats
 */
export async function getStats() {
  try {
    return await getVerificationStats();
  } catch (error) {
    console.error('[VerificationService] Failed to get stats:', error);
    throw error;
  }
}

/**
 * Start automatic periodic verification
 * 
 * @param intervalMinutes - Verification interval in minutes
 * @returns Timer ID
 */
export function startPeriodicVerification(intervalMinutes: number = 30): NodeJS.Timeout {
  console.log(`[VerificationService] Starting periodic verification (every ${intervalMinutes} min)`);
  return schedulePeriodicVerification(intervalMinutes);
}
