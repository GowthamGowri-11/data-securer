/**
 * Recovery Service
 * 
 * High-level service for data recovery operations.
 * Provides a clean API for the frontend to trigger recovery processes.
 */

import { RecoveryResult } from '@/types';
import {
  recoverData,
  recoverMultipleRecords,
  autoRecoverAll,
  previewRecovery,
  getRecoveryStats
} from '@/lib/recovery-engine';

/**
 * Recover a single tampered record
 * 
 * @param dataId - ID of the data to recover
 * @returns Recovery result
 */
export async function recoverSingleRecord(dataId: string): Promise<RecoveryResult> {
  try {
    console.log(`[RecoveryService] Recovering record: ${dataId}`);
    return await recoverData(dataId);
  } catch (error) {
    console.error('[RecoveryService] Recovery failed:', error);
    throw error;
  }
}

/**
 * Recover multiple tampered records
 * 
 * @param dataIds - Array of data IDs to recover
 * @returns Array of recovery results
 */
export async function recoverMultiple(dataIds: string[]): Promise<RecoveryResult[]> {
  try {
    console.log(`[RecoveryService] Recovering ${dataIds.length} records...`);
    return await recoverMultipleRecords(dataIds);
  } catch (error) {
    console.error('[RecoveryService] Batch recovery failed:', error);
    throw error;
  }
}

/**
 * Automatically recover all tampered records
 * 
 * @param userId - Filter by user ID (optional, admin sees all if not provided)
 * @returns Array of recovery results
 */
export async function autoRecover(userId?: string): Promise<RecoveryResult[]> {
  try {
    console.log(`[RecoveryService] Starting auto-recovery for ${userId ? `user ${userId}` : 'all users'}...`);
    return await autoRecoverAll(userId);
  } catch (error) {
    console.error('[RecoveryService] Auto-recovery failed:', error);
    throw error;
  }
}

/**
 * Preview what would be recovered (dry run)
 * 
 * @param dataId - ID of the data to preview
 * @returns Preview information
 */
export async function previewRecoveryData(dataId: string) {
  try {
    console.log(`[RecoveryService] Previewing recovery for: ${dataId}`);
    return await previewRecovery(dataId);
  } catch (error) {
    console.error('[RecoveryService] Preview failed:', error);
    throw error;
  }
}

/**
 * Get recovery statistics
 * 
 * @returns Recovery stats
 */
export async function getStats() {
  try {
    return await getRecoveryStats();
  } catch (error) {
    console.error('[RecoveryService] Failed to get stats:', error);
    throw error;
  }
}
