/**
 * Recovery API Route
 * 
 * POST /api/recover - Recover tampered data from blockchain (filtered by user)
 */

import { NextRequest, NextResponse } from 'next/server';
import { recoverSingleRecord, autoRecover, previewRecoveryData } from '@/services/recovery-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * Input validation schema
 */
const RecoverSchema = z.object({
  dataId: z.string().min(1, 'Data ID is required'),
  preview: z.boolean().optional(),
});

/**
 * POST /api/recover
 * 
 * Recover tampered data from blockchain.
 * Admin can recover all data, regular users can only recover their own.
 * 
 * Process:
 * 1. Validate input
 * 2. Verify tampering exists
 * 3. Retrieve encrypted data from blockchain
 * 4. Decrypt data using AES-256
 * 5. Verify decrypted data integrity
 * 6. Restore original data to database
 * 7. Create recovery audit log
 * 8. Return success response
 * 
 * @body dataId - ID of sensor data to recover (optional, if not provided recovers all)
 * @body preview - If true, only preview recovery without executing (optional)
 * @header x-user-id - User ID from authentication
 * @header x-user-role - User role from authentication
 * 
 * @returns Recovery result with status and recovered data
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] POST /api/recover - Received request');
    
    // Get user info from headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId || !userRole) {
      console.error('[API] Missing authentication headers');
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Check if auto-recovering all tampered records
    if (!body.dataId) {
      console.log(`[API] Auto-recovering all tampered records for ${userRole === 'admin' ? 'admin (all data)' : `user ${userId}`}...`);
      
      // Admin sees all, users see only their own
      const filterUserId = userRole === 'admin' ? undefined : userId;
      const results = await autoRecover(filterUserId);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      console.log(`[API] ✓ Auto-recovery complete: ${successCount} successful, ${failCount} failed`);
      
      return NextResponse.json(
        {
          success: true,
          message: `Recovered ${successCount} of ${results.length} tampered records`,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failCount,
          },
          results: results.map(r => ({
            dataId: r.dataId,
            success: r.success,
            message: r.message,
            recoveredData: r.recoveredData ? {
              dataType: r.recoveredData.dataType,
              dataValue: r.recoveredData.dataValue,
              timestamp: r.recoveredData.timestamp,
            } : null,
          })),
        },
        { status: 200 }
      );
    }
    
    // Validate input
    const validation = RecoverSchema.safeParse(body);
    
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
    
    const { dataId, preview } = validation.data;
    
    // Handle preview mode
    if (preview) {
      console.log(`[API] Previewing recovery for: ${dataId}`);
      
      const previewResult = await previewRecoveryData(dataId);
      
      return NextResponse.json(
        {
          success: true,
          preview: true,
          canRecover: previewResult.canRecover,
          message: previewResult.message,
          currentData: previewResult.currentData,
          recoveredData: previewResult.recoveredData,
        },
        { status: 200 }
      );
    }
    
    // Execute recovery
    console.log(`[API] Recovering data: ${dataId}`);
    
    const result = await recoverSingleRecord(dataId);
    
    if (result.success) {
      console.log('[API] ✓ Recovery successful');
      
      return NextResponse.json(
        {
          success: true,
          message: result.message || 'Data recovered successfully',
          result: {
            dataId: result.dataId,
            recoveredData: result.recoveredData ? {
              id: result.recoveredData.id,
              dataType: result.recoveredData.dataType,
              dataValue: result.recoveredData.dataValue,
              timestamp: result.recoveredData.timestamp,
              hash: result.recoveredData.hash.slice(0, 16) + '...',
            } : null,
          },
        },
        { status: 200 }
      );
    } else {
      console.log('[API] ✗ Recovery failed:', result.message);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Recovery failed',
          message: result.message,
          dataId: result.dataId,
        },
        { status: 200 } // Changed to 200 so frontend can handle the message properly
      );
    }
  } catch (error) {
    console.error('[API] ✗ Error during recovery:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Recovery failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recover
 * 
 * Get recovery statistics
 * 
 * @returns Recovery statistics
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/recover - Received request');
    
    const { getStats } = await import('@/services/recovery-service');
    const stats = await getStats();
    
    return NextResponse.json(
      {
        success: true,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] ✗ Error fetching recovery stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch recovery statistics',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
