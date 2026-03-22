import { cookies } from 'next/headers';
import { prisma } from '@/database/client';
import { getAllSensorData } from '@/database/queries';
import DashboardClient from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Get user from cookies
  const cookieStore = cookies();
  const authCookie = cookieStore.get('tamperguard_auth');
  
  let user = null;
  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie.value);
      user = authData.user;
    } catch (e) {
      console.error('Failed to parse auth cookie on server');
    }
  }

  // Determine filter
  const userFilter = user?.role === 'admin' ? {} : (user?.id ? { userId: user.id } : { userId: 'guest' });

  // Get total records
  const totalRecords = await prisma.sensorData.count({ where: userFilter });

  // Get all unique dataIds that have ANY audit logs for this user/filter
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

  // Get last verification log
  const lastVerificationLog = allAuditLogs.find(l => 
    ['VERIFICATION_PASSED', 'VERIFICATION_FAILED'].includes(l.eventType)
  );

  // Get recent data
  const recentData = await getAllSensorData(10, 0, user?.role === 'admin' ? undefined : user?.id);

  const stats = {
    totalRecords,
    verifiedRecords,
    tamperedRecords,
    recoveredRecords,
    lastVerification: lastVerificationLog ? new Date(lastVerificationLog.timestamp).toLocaleString() : null,
  };

  // Format data for client
  const formattedData = recentData.map(item => ({
    id: item.id,
    dataType: item.dataType,
    dataValue: item.dataValue,
    timestamp: item.timestamp.toISOString(),
    hash: item.hash.slice(0, 16) + '...',
    blockchainTxHash: item.blockchainTxHash,
  }));

  return (
    <DashboardClient 
      initialStats={stats} 
      initialData={formattedData} 
    />
  );
}
