/**
 * Sensor Data API Route
 * 
 * POST /api/sensor-data - Submit new sensor data
 * GET /api/sensor-data - Fetch all sensor data (filtered by user)
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitSensorData, fetchAllSensorData } from '@/services/data-service';
import { z } from 'zod';

/**
 * Input validation schema
 */
const SensorDataSchema = z.object({
  dataType: z.string().min(1, 'Data type is required').max(100, 'Data type too long'),
  dataValue: z.string().min(1, 'Data value is required').max(500, 'Data value too long'),
  timestamp: z.string().datetime('Invalid timestamp format'),
});

/**
 * Helper function to get user from request headers
 */
function getUserFromRequest(request: NextRequest): { userId: string; role: string } | null {
  try {
    const authHeader = request.headers.get('x-user-auth');
    if (!authHeader) {
      // Try to get from cookies as fallback
      const cookies = request.cookies.get('tamperguard_auth');
      if (cookies) {
        const authData = JSON.parse(cookies.value);
        return { userId: authData.user.id, role: authData.user.role };
      }
      return null;
    }
    const authData = JSON.parse(authHeader);
    return { userId: authData.userId, role: authData.role };
  } catch (error) {
    console.error('[API] Failed to parse auth data:', error);
    return null;
  }
}

/**
 * POST /api/sensor-data
 * 
 * Submit new sensor data with full security pipeline:
 * 1. Validate input data
 * 2. Generate SHA-256 hash
 * 3. Encrypt data with AES-256
 * 4. Store proof on blockchain
 * 5. Save to database
 * 6. Create audit log
 * 
 * @body dataType - Type of sensor data (e.g., "Temperature", "Humidity")
 * @body dataValue - Sensor reading value
 * @body timestamp - ISO 8601 timestamp
 * @header x-user-id - User ID from authentication
 * 
 * @returns Created sensor data record with hash and blockchain transaction
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] POST /api/sensor-data - Received request');
    
    // Get userId from header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      console.error('[API] Missing user ID in request');
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in request headers',
        },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validation = SensorDataSchema.safeParse(body);
    
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
    
    const { dataType, dataValue, timestamp } = validation.data;
    
    console.log(`[API] Processing for user ${userId}: ${dataType} = ${dataValue}`);
    
    // Submit data through service layer
    const data = await submitSensorData(
      userId,
      dataType,
      dataValue,
      new Date(timestamp)
    );
    
    console.log('[API] ✓ Data submitted successfully');
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Sensor data submitted successfully',
        data: {
          id: data.id,
          dataType: data.dataType,
          dataValue: data.dataValue,
          timestamp: data.timestamp,
          hash: data.hash,
          blockchainTxHash: data.blockchainTxHash,
          createdAt: data.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] ✗ Error submitting sensor data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit sensor data',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sensor-data
 * 
 * Fetch sensor data records (filtered by user, admin sees all)
 * 
 * @query limit - Maximum number of records (default: 100)
 * @query offset - Number of records to skip (default: 0)
 * @header x-user-id - User ID from authentication
 * @header x-user-role - User role from authentication
 * 
 * @returns Array of sensor data records
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/sensor-data - Received request');
    
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
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Validate parameters
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid limit parameter (must be between 1 and 1000)',
        },
        { status: 400 }
      );
    }
    
    if (offset < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid offset parameter (must be >= 0)',
        },
        { status: 400 }
      );
    }
    
    // Fetch data - admin sees all, users see only their own
    const filterUserId = userRole === 'admin' ? undefined : userId;
    const data = await fetchAllSensorData(filterUserId);
    
    console.log(`[API] ✓ Fetched ${data.length} records for ${userRole === 'admin' ? 'admin (all data)' : `user ${userId}`}`);
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        count: data.length,
        data: data.map(item => ({
          id: item.id,
          dataType: item.dataType,
          dataValue: item.dataValue,
          timestamp: item.timestamp,
          hash: item.hash.slice(0, 16) + '...', // Truncate for response
          blockchainTxHash: item.blockchainTxHash,
          createdAt: item.createdAt,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] ✗ Error fetching sensor data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sensor data',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
