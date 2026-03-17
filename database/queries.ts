/**
 * Database Query Functions
 * 
 * This module provides a clean API for all database operations.
 * All functions include error handling and logging.
 */

import { prisma } from './client';
import { SensorData, AuditLog } from '@/types';

/**
 * Save sensor data to database
 * 
 * @param data - Sensor data to save (without id and createdAt)
 * @returns Created sensor data record
 * 
 * @example
 * const data = await saveSensorData({
 *   userId: "user-123",
 *   dataType: "Temperature",
 *   dataValue: "25.5",
 *   timestamp: new Date(),
 *   hash: "abc123...",
 *   encryptedData: "encrypted...",
 *   blockchainTxHash: "0x123..."
 * });
 */
export async function saveSensorData(
  data: Omit<SensorData, 'id' | 'createdAt'>
): Promise<SensorData> {
  try {
    console.log('[Database] Saving sensor data...');
    
    const result = await prisma.sensorData.create({
      data: {
        userId: data.userId,
        dataType: data.dataType,
        dataValue: data.dataValue,
        timestamp: data.timestamp,
        hash: data.hash,
        encryptedData: data.encryptedData,
        blockchainTxHash: data.blockchainTxHash,
      },
    });
    
    console.log(`[Database] ✓ Sensor data saved with ID: ${result.id}`);
    
    return result as SensorData;
  } catch (error) {
    console.error('[Database] ✗ Failed to save sensor data:', error);
    throw new Error(`Database save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get sensor data by ID
 * 
 * @param id - Sensor data ID
 * @returns Sensor data record or null if not found
 */
export async function getSensorDataById(id: string): Promise<SensorData | null> {
  try {
    console.log(`[Database] Fetching sensor data: ${id}`);
    
    const result = await prisma.sensorData.findUnique({
      where: { id },
    });
    
    if (result) {
      console.log(`[Database] ✓ Sensor data found`);
    } else {
      console.log(`[Database] ⚠ Sensor data not found`);
    }
    
    return result as SensorData | null;
  } catch (error) {
    console.error('[Database] ✗ Failed to fetch sensor data:', error);
    throw new Error(`Database fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all sensor data records
 * 
 * @param limit - Maximum number of records to return (default: 100)
 * @param offset - Number of records to skip (default: 0)
 * @param userId - Filter by user ID (optional, admin sees all if not provided)
 * @returns Array of sensor data records
 */
export async function getAllSensorData(
  limit: number = 100,
  offset: number = 0,
  userId?: string
): Promise<SensorData[]> {
  try {
    console.log(`[Database] Fetching sensor data (limit: ${limit}, offset: ${offset}, userId: ${userId || 'all'})`);
    
    const results = await prisma.sensorData.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    
    console.log(`[Database] ✓ Found ${results.length} sensor data records`);
    
    return results as SensorData[];
  } catch (error) {
    console.error('[Database] ✗ Failed to fetch sensor data:', error);
    throw new Error(`Database fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update sensor data record
 * 
 * @param id - Sensor data ID
 * @param data - Partial sensor data to update
 * @returns Updated sensor data record
 */
export async function updateSensorData(
  id: string,
  data: Partial<Omit<SensorData, 'id' | 'createdAt'>>
): Promise<SensorData> {
  try {
    console.log(`[Database] Updating sensor data: ${id}`);
    
    const result = await prisma.sensorData.update({
      where: { id },
      data: {
        dataType: data.dataType,
        dataValue: data.dataValue,
        timestamp: data.timestamp,
        hash: data.hash,
        encryptedData: data.encryptedData,
        blockchainTxHash: data.blockchainTxHash,
      },
    });
    
    console.log(`[Database] ✓ Sensor data updated`);
    
    return result as SensorData;
  } catch (error) {
    console.error('[Database] ✗ Failed to update sensor data:', error);
    throw new Error(`Database update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete sensor data record
 * 
 * @param id - Sensor data ID
 * @returns Deleted sensor data record
 */
export async function deleteSensorData(id: string): Promise<SensorData> {
  try {
    console.log(`[Database] Deleting sensor data: ${id}`);
    
    const result = await prisma.sensorData.delete({
      where: { id },
    });
    
    console.log(`[Database] ✓ Sensor data deleted`);
    
    return result as SensorData;
  } catch (error) {
    console.error('[Database] ✗ Failed to delete sensor data:', error);
    throw new Error(`Database delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get sensor data count
 * 
 * @param userId - Filter by user ID (optional, admin sees all if not provided)
 * @returns Total number of sensor data records
 */
export async function getSensorDataCount(userId?: string): Promise<number> {
  try {
    const count = await prisma.sensorData.count({
      where: userId ? { userId } : undefined,
    });
    console.log(`[Database] Total sensor data records: ${count}`);
    return count;
  } catch (error) {
    console.error('[Database] ✗ Failed to count sensor data:', error);
    throw new Error(`Database count failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create audit log entry
 * 
 * @param log - Audit log data (without id and timestamp)
 * @returns Created audit log record
 * 
 * @example
 * await createAuditLog({
 *   userId: "user-123",
 *   eventType: "DATA_SUBMITTED",
 *   dataId: "data-123",
 *   details: "Sensor data submitted successfully"
 * });
 */
export async function createAuditLog(
  log: Omit<AuditLog, 'id' | 'timestamp'>
): Promise<AuditLog> {
  try {
    console.log(`[Database] Creating audit log: ${log.eventType}`);
    
    const result = await prisma.auditLog.create({
      data: {
        userId: log.userId,
        eventType: log.eventType,
        dataId: log.dataId,
        details: log.details,
      },
    });
    
    console.log(`[Database] ✓ Audit log created with ID: ${result.id}`);
    
    return result as AuditLog;
  } catch (error) {
    console.error('[Database] ✗ Failed to create audit log:', error);
    throw new Error(`Audit log creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all audit logs
 * 
 * @param limit - Maximum number of logs to return (default: 100)
 * @param offset - Number of logs to skip (default: 0)
 * @param eventType - Filter by event type (optional)
 * @param userId - Filter by user ID (optional, admin sees all if not provided)
 * @returns Array of audit log records
 */
export async function getAuditLogs(
  limit: number = 100,
  offset: number = 0,
  eventType?: string,
  userId?: string
): Promise<AuditLog[]> {
  try {
    console.log(`[Database] Fetching audit logs (limit: ${limit}, offset: ${offset}, userId: ${userId || 'all'})`);
    
    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (userId) where.userId = userId;
    
    const results = await prisma.auditLog.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
    
    console.log(`[Database] ✓ Found ${results.length} audit logs`);
    
    return results as AuditLog[];
  } catch (error) {
    console.error('[Database] ✗ Failed to fetch audit logs:', error);
    throw new Error(`Audit log fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get audit logs by data ID
 * 
 * @param dataId - Sensor data ID
 * @returns Array of audit logs for the specified data
 */
export async function getAuditLogsByDataId(dataId: string): Promise<AuditLog[]> {
  try {
    console.log(`[Database] Fetching audit logs for data: ${dataId}`);
    
    const results = await prisma.auditLog.findMany({
      where: { dataId },
      orderBy: { timestamp: 'desc' },
    });
    
    console.log(`[Database] ✓ Found ${results.length} audit logs for data ${dataId}`);
    
    return results as AuditLog[];
  } catch (error) {
    console.error('[Database] ✗ Failed to fetch audit logs by data ID:', error);
    throw new Error(`Audit log fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get audit log count
 * 
 * @param eventType - Filter by event type (optional)
 * @param userId - Filter by user ID (optional, admin sees all if not provided)
 * @returns Total number of audit logs
 */
export async function getAuditLogCount(eventType?: string, userId?: string): Promise<number> {
  try {
    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (userId) where.userId = userId;
    
    const count = await prisma.auditLog.count({
      where: Object.keys(where).length > 0 ? where : undefined,
    });
    console.log(`[Database] Total audit logs: ${count}`);
    return count;
  } catch (error) {
    console.error('[Database] ✗ Failed to count audit logs:', error);
    throw new Error(`Audit log count failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get recent audit logs by event type
 * 
 * @param eventType - Event type to filter
 * @param limit - Maximum number of logs (default: 10)
 * @returns Array of recent audit logs
 */
export async function getRecentAuditLogsByType(
  eventType: string,
  limit: number = 10
): Promise<AuditLog[]> {
  try {
    const results = await prisma.auditLog.findMany({
      where: { eventType },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    
    return results as AuditLog[];
  } catch (error) {
    console.error('[Database] ✗ Failed to fetch recent audit logs:', error);
    throw new Error(`Audit log fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear all data (for testing only)
 * WARNING: This deletes all data from the database
 */
export async function clearAllData(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clear data in production');
  }
  
  try {
    console.log('[Database] Clearing all data...');
    
    await prisma.auditLog.deleteMany();
    await prisma.sensorData.deleteMany();
    
    console.log('[Database] ✓ All data cleared');
  } catch (error) {
    console.error('[Database] ✗ Failed to clear data:', error);
    throw new Error(`Data clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
