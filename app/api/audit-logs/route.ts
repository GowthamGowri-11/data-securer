/**
 * Audit Logs API Route
 * 
 * GET /api/audit-logs - Fetch audit logs (filtered by user)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs, getAuditLogsByDataId, getAuditLogCount } from '@/database/queries';

/**
 * GET /api/audit-logs
 * 
 * Fetch audit logs with optional filtering and pagination.
 * Admin sees all logs, regular users see only their own.
 * 
 * @query limit - Maximum number of logs to return (default: 100, max: 1000)
 * @query offset - Number of logs to skip (default: 0)
 * @query eventType - Filter by event type (optional)
 * @query dataId - Filter by data ID (optional)
 * @header x-user-id - User ID from authentication
 * @header x-user-role - User role from authentication
 * 
 * @returns Array of audit log records
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/audit-logs - Received request');
    
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
    const eventType = searchParams.get('eventType') || undefined;
    const dataId = searchParams.get('dataId') || undefined;
    
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
    
    // Determine filter - admin sees all, users see only their own
    const filterUserId = userRole === 'admin' ? undefined : userId;
    
    // Fetch logs based on filters
    let logs;
    let totalCount;
    
    if (dataId) {
      console.log(`[API] Fetching logs for data ID: ${dataId}`);
      logs = await getAuditLogsByDataId(dataId);
      // Filter by userId if not admin
      if (filterUserId) {
        logs = logs.filter(log => log.userId === filterUserId);
      }
      totalCount = logs.length;
    } else {
      console.log(`[API] Fetching logs for ${userRole === 'admin' ? 'admin (all data)' : `user ${userId}`}`);
      logs = await getAuditLogs(limit, offset, eventType, filterUserId);
      totalCount = await getAuditLogCount(eventType, filterUserId);
    }
    
    console.log(`[API] ✓ Fetched ${logs.length} audit logs`);
    
    // Group logs by event type for summary
    const eventTypeCounts: Record<string, number> = {};
    logs.forEach(log => {
      eventTypeCounts[log.eventType] = (eventTypeCounts[log.eventType] || 0) + 1;
    });
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        count: logs.length,
        totalCount,
        summary: {
          byEventType: eventTypeCounts,
        },
        data: logs.map(log => ({
          id: log.id,
          eventType: log.eventType,
          dataId: log.dataId,
          details: log.details,
          timestamp: log.timestamp,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] ✗ Error fetching audit logs:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch audit logs',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit-logs
 * 
 * Create a new audit log entry (for manual logging)
 * 
 * @body eventType - Type of event
 * @body dataId - Related data ID
 * @body details - Event details
 * @header x-user-id - User ID from authentication
 * 
 * @returns Created audit log
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] POST /api/audit-logs - Received request');
    
    // Get userId from header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      console.error('[API] Missing user ID in request');
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { eventType, dataId, details } = body;
    
    // Validate required fields
    if (!eventType || !dataId || !details) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: eventType, dataId, details',
        },
        { status: 400 }
      );
    }
    
    // Create audit log
    const { createAuditLog } = await import('@/database/queries');
    const log = await createAuditLog({
      userId,
      eventType,
      dataId,
      details,
    });
    
    console.log(`[API] ✓ Audit log created: ${log.id}`);
    
    return NextResponse.json(
      {
        success: true,
        message: 'Audit log created successfully',
        data: {
          id: log.id,
          eventType: log.eventType,
          dataId: log.dataId,
          details: log.details,
          timestamp: log.timestamp,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] ✗ Error creating audit log:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create audit log',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
