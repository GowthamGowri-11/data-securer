/**
 * Dashboard Stats API Route
 * 
 * GET /api/dashboard-stats - Get dashboard statistics (filtered by user)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/client';

/**
 * GET /api/dashboard-stats
 * 
 * Returns dashboard statistics including:
 * - Total records
 * - Verified records
 * - Tampered records
 * - Recovered records
 * - Last verification time
 * 
 * Admin sees all data, regular users see only their own
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/dashboard-stats - Fetching statistics');

    // Get user info from headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId || !userRole) {
      console.error('[API] Missing authentication headers');
      return NextResponse.json(
        {
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Determine filter - admin sees all, users see only their own
    const userFilter = userRole === 'admin' ? {} : { userId };

    // Get total records
    const totalRecords = await prisma.sensorData.count({
      where: userFilter,
    });

    // Get audit logs to calculate stats
    const auditLogs = await prisma.auditLog.findMany({
      where: userFilter,
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Count verified records (VERIFICATION_PASSED events)
    const verifiedRecords = auditLogs.filter(
      log => log.eventType === 'VERIFICATION_PASSED'
    ).length;

    // Count tampered records (TAMPER_DETECTED events)
    const tamperedRecords = auditLogs.filter(
      log => log.eventType === 'TAMPER_DETECTED'
    ).length;

    // Count recovered records (RECOVERY_SUCCESS events)
    const recoveredRecords = auditLogs.filter(
      log => log.eventType === 'RECOVERY_SUCCESS' || log.eventType === 'DELETED_DATA_RECOVERED'
    ).length;

    // Get last verification time
    const lastVerificationLog = auditLogs.find(
      log => log.eventType === 'VERIFICATION_PASSED' || log.eventType === 'VERIFICATION_FAILED'
    );

    const lastVerification = lastVerificationLog
      ? new Date(lastVerificationLog.timestamp).toLocaleString()
      : null;

    const stats = {
      totalRecords,
      verifiedRecords,
      tamperedRecords,
      recoveredRecords,
      lastVerification,
    };

    console.log(`[API] ✓ Dashboard stats for ${userRole === 'admin' ? 'admin (all data)' : `user ${userId}`}:`, stats);

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('[API] ✗ Error fetching dashboard stats:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
