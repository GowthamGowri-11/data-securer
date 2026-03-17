'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StatusCard from '@/components/StatusCard';
import DataTable from '@/components/DataTable';
import IntegrityIndicator from '@/components/IntegrityIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
  totalRecords: number;
  verifiedRecords: number;
  tamperedRecords: number;
  recoveredRecords: number;
  lastVerification: string | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRecords: 0,
    verifiedRecords: 0,
    tamperedRecords: 0,
    recoveredRecords: 0,
    lastVerification: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
      // Refresh every 30 seconds
      const interval = setInterval(fetchDashboardStats, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/dashboard-stats', {
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const integrityStatus = stats.tamperedRecords > 0 ? 'compromised' : 'secure';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-white">Dashboard</h1>
        <IntegrityIndicator status={integrityStatus} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatusCard 
          title="Total Records" 
          value={loading ? '...' : stats.totalRecords.toString()} 
          icon="📊" 
          trend="+0%"
        />
        <StatusCard 
          title="Verified" 
          value={loading ? '...' : stats.verifiedRecords.toString()} 
          icon="✓" 
          trend="+0%"
          color="green"
        />
        <StatusCard 
          title="Tampered" 
          value={loading ? '...' : stats.tamperedRecords.toString()} 
          icon="⚠️" 
          trend="0%"
          color="red"
        />
        <StatusCard 
          title="Recovered" 
          value={loading ? '...' : stats.recoveredRecords.toString()} 
          icon="🔄" 
          trend="+0%"
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Blockchain Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Network</span>
              <span className="text-white font-semibold">Sepolia Testnet</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Contract</span>
              <span className="text-white font-semibold text-sm">0xA5D8...1cEe</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Total Records</span>
              <span className="text-white font-semibold">{stats.totalRecords}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Last Verification</span>
              <span className="text-white font-semibold">
                {stats.lastVerification || 'Never'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Database</span>
              <span className="text-green-400 font-semibold">✓ Connected</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Blockchain</span>
              <span className="text-green-400 font-semibold">✓ Connected</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Integrity Status</span>
              <span className={`font-semibold ${stats.tamperedRecords > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {stats.tamperedRecords > 0 ? '⚠ Compromised' : '✓ Secure'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Auto-Recovery</span>
              <span className="text-green-400 font-semibold">✓ Enabled</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Sensor Data</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable />
        </CardContent>
      </Card>
    </div>
  );
}
