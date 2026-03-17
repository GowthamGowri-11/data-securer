/**
 * Verification API Route
 * 
 * POST /api/verify - Verify data integrity (filtered by user)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySingleRecord, verifyAllRecords } from '@/services/verification-service';
import { z } from 'zod';

/**
 * Input validation schema for single record verification
 */
const VerifySchema = z.object({
  dataId: z.string().min(1, 'Data ID is required'),
});

/**
 * POST /api/verify
 * 
 * Verify data integrity by comparing database hash with blockchain hash.
 * Admin can verify all data, regular users can only verify their own.
 * 
 * Process:
 * 1. Validate input
 * 2. Fetch data from database
 * 3. Compute current hash
 * 4. Retrieve original hash from blockchain
 * 5. Compare hashes
 * 6. Log verification event
 * 7. Return result (SECURE or TAMPERED)
 * 
 * @body dataId - ID of sensor data to verify (optional, if not provided verifies all)
 * @header x-user-id - User ID from authentication
 * @header x-user-role - User role from authentication
 * 
 * @returns Verification result with status and details
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] POST /api/verify - Received request');
    
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
    
    // Check if verifying all records or single record
    if (!body.dataId) {
      console.log(`[API] Verifying all records for ${userRole === 'admin' ? 'admin (all data)' : `user ${userId}`}...`);
      
      // Admin sees all, users see only their own
      const filterUserId = userRole === 'admin' ? undefined : userId;
      const results = await verifyAllRecords(filterUserId);
      
      const tamperedCount = results.filter(r => !r.isValid).length;
      const secureCount = results.filter(r => r.isValid).length;
      
      console.log(`[API] ✓ Verification complete: ${secureCount} secure, ${tamperedCount} tampered`);
      
      return NextResponse.json(
        {
          success: true,
          message: `Verified ${results.length} records`,
          summary: {
            total: results.length,
            secure: secureCount,
            tampered: tamperedCount,
          },
          results: results.map(r => ({
            dataId: r.dataId,
            isValid: r.isValid,
            status: r.isValid ? 'SECURE' : 'TAMPERED',
            message: r.message,
            timestamp: r.timestamp,
          })),
        },
        { status: 200 }
      );
    }
    
    // Validate single record input
    const validation = VerifySchema.safeParse(body);
    
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
    
    const { dataId } = validation.data;
    
    console.log(`[API] Verifying data: ${dataId}`);
    
    // Run verification
    const result = await verifySingleRecord(dataId);
    
    // Determine status
    const status = result.isValid ? 'SECURE' : 'TAMPERED';
    
    console.log(`[API] ✓ Verification complete: ${status}`);
    
    // Return response
    return NextResponse.json(
      {
        success: true,
        status,
        result: {
          dataId: result.dataId,
          isValid: result.isValid,
          databaseHash: result.databaseHash.slice(0, 16) + '...',
          blockchainHash: result.blockchainHash.slice(0, 16) + '...',
          message: result.message,
          timestamp: result.timestamp,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] ✗ Error during verification:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Verification failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verify
 * 
 * Get verification statistics
 * 
 * @returns Verification statistics
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/verify - Received request');
    
    // Import verification stats function
    const { getStats } = await import('@/services/verification-service');
    const stats = await getStats();
    
    return NextResponse.json(
      {
        success: true,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] ✗ Error fetching verification stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch verification statistics',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
