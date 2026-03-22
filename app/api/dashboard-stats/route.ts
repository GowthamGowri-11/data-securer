/**
 * Dashboard Stats API Route
 * 
 * GET /api/dashboard-stats - Get dashboard statistics (filtered by user)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/client';

export const dynamic = 'force-dynamic';

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

    // Get all unique dataIds that have ANY audit logs
    const allAuditLogs = await prisma.auditLog.findMany({
      where: userFilter,
      select: { dataId: true, eventType: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
    });

    // Group logs by dataId and get the LATEST event for each
    const latestEventsMap = new Map<string, string>();
    const allRecoveredIds = new Set<string>();
    
    for (const log of allAuditLogs) {
      if (!latestEventsMap.has(log.dataId)) {
        latestEventsMap.set(log.dataId, log.eventType);
      }
      if (['RECOVERY_SUCCESS', 'DELETED_DATA_RECOVERED'].includes(log.eventType)) {
        allRecoveredIds.add(log.dataId);
      }
    }

    // Active Tampered = Latest event is TAMPER_DETECTED or VERIFICATION_FAILED
    let tamperedRecords = 0;
    for (const [dataId, eventType] of latestEventsMap.entries()) {
      if (['TAMPER_DETECTED', 'VERIFICATION_FAILED'].includes(eventType)) {
        tamperedRecords++;
      }
    }

    // Recovered records = total unique records ever recovered
    const recoveredRecords = allRecoveredIds.size;

    // Verified = Total records minus those currently tampered/failed
    const verifiedRecords = Math.max(0, totalRecords - tamperedRecords);

    // Get last verification time
    const lastVerificationLog = allAuditLogs.find(l => 
      ['VERIFICATION_PASSED', 'VERIFICATION_FAILED'].includes(l.eventType)
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
