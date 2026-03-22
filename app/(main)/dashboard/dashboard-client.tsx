'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StatusCard from '@/components/StatusCard';
import DataTable from '@/components/DataTable';
import IntegrityIndicator from '@/components/IntegrityIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface DashboardStats {
  totalRecords: number;
  verifiedRecords: number;
  tamperedRecords: number;
  recoveredRecords: number;
  lastVerification: string | null;
}

interface DashboardClientProps {
  initialStats: DashboardStats;
  initialData: any[]; // Ideally typed but using any for brevity for now
}

export default function DashboardClient({ initialStats, initialData }: DashboardClientProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Periodic refresh
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
        setError(null);
      }
    } catch (error) {
      console.error('Failed to refresh dashboard stats:', error);
    }
  };

    const integrityStatus = stats.tamperedRecords > 0 ? 'compromised' : 'secure';
    const total = stats.totalRecords || 1;
    const verifiedShare = Math.round((stats.verifiedRecords / total) * 100);
    const tamperedShare = Math.round((stats.tamperedRecords / total) * 100);
    const recoveredShare = Math.round((stats.recoveredRecords / total) * 100);

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          <IntegrityIndicator status={integrityStatus} />
        </div>
  
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatusCard 
            title="Total Records" 
            value={stats.totalRecords.toString()} 
            icon="📊" 
            trend="100%"
          />
          <StatusCard 
            title="Verified" 
            value={stats.verifiedRecords.toString()} 
            icon="✓" 
            trend={`${verifiedShare}%`}
            color="green"
          />
          <StatusCard 
            title="Tampered" 
            value={stats.tamperedRecords.toString()} 
            icon="⚠️" 
            trend={`${tamperedShare}%`}
            color="red"
          />
          <StatusCard 
            title="Recovered" 
            value={stats.recoveredRecords.toString()} 
            icon="🔄" 
            trend={`${recoveredShare}%`}
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
          <DataTable initialData={initialData} />
        </CardContent>
      </Card>
    </div>
  );
}
