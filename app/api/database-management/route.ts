/**
 * Database Management API Route
 * 
 * PUT /api/database-management - Manually tamper with data (for testing)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/client';
import { createAuditLog } from '@/database/queries';
import { z } from 'zod';

/**
 * Input validation schema
 */
const TamperSchema = z.object({
  dataId: z.string().min(1, 'Data ID is required'),
  newValue: z.string().min(1, 'New value is required'),
});

/**
 * PUT /api/database-management
 * 
 * Manually modify data value in database (simulates tampering).
 * This does NOT update the blockchain, causing a hash mismatch.
 * 
 * Process:
 * 1. Validate input
 * 2. Find record in database
 * 3. Update dataValue (without updating hash or blockchain)
 * 4. Log tampering event
 * 5. Return success
 * 
 * @body dataId - ID of sensor data to modify
 * @body newValue - New value to set (tampered value)
 * 
 * @returns Updated record information
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('[API] PUT /api/database-management - Received request');
    
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validation = TamperSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('[API] Validation failed:', validation.error.issues);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }
    
    const { dataId, newValue } = validation.data;
    
    console.log(`[API] Tampering with data: ${dataId} -> ${newValue}`);
    
    // Find existing record
    const existingRecord = await prisma.sensorData.findUnique({
      where: { id: dataId },
    });
    
    if (!existingRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Record not found',
          message: `No record found with ID: ${dataId}`,
        },
        { status: 404 }
      );
    }
    
    // Store old value for logging
    const oldValue = existingRecord.dataValue;
    
    // Update ONLY the dataValue (NOT the hash or blockchain)
    // This creates a hash mismatch that will be detected by verification
    const updatedRecord = await prisma.sensorData.update({
      where: { id: dataId },
      data: {
        dataValue: newValue,
        updatedAt: new Date(),
      },
    });
    
    // Log tampering event
    await createAuditLog({
      userId: existingRecord.userId,
      eventType: 'DATA_TAMPERED',
      dataId: dataId,
      details: `Data manually modified: ${oldValue} -> ${newValue} (Testing tampering detection)`,
    });
    
    console.log('[API] ✓ Data tampered successfully (for testing)');
    
    return NextResponse.json(
      {
        success: true,
        message: 'Data modified successfully. Hash mismatch will be detected on verification.',
        data: {
          id: updatedRecord.id,
          dataType: updatedRecord.dataType,
          oldValue: oldValue,
          newValue: updatedRecord.dataValue,
          hash: updatedRecord.hash,
          note: 'Hash remains unchanged - verification will detect tampering',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] ✗ Error tampering with data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to modify data',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
