'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RefreshCw, CheckCircle, AlertTriangle, Loader2, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function RecoveryContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [dataId, setDataId] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCount: 0,
    successRate: 100,
    lastRecovery: null as string | null
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/recover', {
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch recovery stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    const urlDataId = searchParams.get('dataId');
    if (urlDataId) {
      setDataId(urlDataId);
    }
  }, [searchParams]);

  const handleRecover = async () => {
    if (!dataId.trim()) {
      setError('Please enter a Data ID');
      return;
    }
    
    setIsRecovering(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await fetch('/api/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({ dataId: dataId.trim() }),
      });

      const data = await response.json();

      // Handle both success and informational responses
      if (data.success) {
        setResult(data.result);
      } else {
        // Show the result with message for user to see
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery failed');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <RefreshCw className="w-10 h-10 text-orange-400 shadow-lg shadow-orange-500/20" />
        <div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight">Data Recovery Engine</h1>
          <p className="text-slate-400 mt-1">Restore tampered data from blockchain records</p>
        </div>
      </div>

      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Data Recovery</CardTitle>
          <CardDescription className="text-slate-400">
            Retrieve and decrypt original data from blockchain when tampering is detected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Database className="w-4 h-4 text-orange-400" />
              Data ID
            </label>
            <Input
              type="text"
              value={dataId}
              onChange={(e) => setDataId(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              placeholder="Enter data ID to recover (e.g., uuid-from-submission)"
              onKeyDown={(e) => e.key === 'Enter' && handleRecover()}
            />
            <p className="text-xs text-slate-500 mt-1">Enter the Data ID of tampered data to restore from blockchain</p>
          </div>
          
          <button
            onClick={handleRecover}
            disabled={isRecovering || !dataId.trim()}
            className="w-full inline-flex items-center justify-center h-14 px-8 rounded-lg text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20"
          >
            {isRecovering ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Recovering Data...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Restore Original Data
              </>
            )}
          </button>

          {error && (
            <div className="bg-slate-900/50 p-4 rounded-lg border border-red-500/30 bg-red-500/10">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {result && !result.success && result.message && (
            <div className="bg-slate-900/50 p-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-yellow-400">
                    Recovery Information
                  </h3>
                  <p className="text-slate-300 mb-4">{result.message}</p>
                  
                  {result.message.includes('not found') && (
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <p className="text-sm text-slate-400 mb-3">
                        💡 The data may have been deleted from the database, but it still exists on the blockchain.
                        The system will attempt to restore it automatically.
                      </p>
                      <button
                        onClick={handleRecover}
                        disabled={isRecovering}
                        className="w-full inline-flex items-center justify-center h-12 px-6 rounded-lg text-base font-semibold bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white transition-all disabled:opacity-50"
                      >
                        {isRecovering ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Restoring from Blockchain...
                          </>
                        ) : (
                          <>
                            <Database className="w-5 h-5 mr-2" />
                            Restore Deleted Data from Blockchain
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {result && result.recoveredData && (
            <div className="bg-slate-900/50 p-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-emerald-400">
                    Recovery Successful
                  </h3>
                  <p className="text-slate-300 mb-4">Data has been restored from blockchain</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                      <span className="text-slate-400 text-sm">Data ID</span>
                      <span className="text-white font-mono text-sm">{result.recoveredData.id}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                      <span className="text-slate-400 text-sm">Data Type</span>
                      <span className="text-white font-semibold">{result.recoveredData.dataType}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                      <span className="text-slate-400 text-sm">Recovered Value</span>
                      <span className="text-emerald-400 font-semibold">{result.recoveredData.dataValue}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                      <span className="text-slate-400 text-sm">Timestamp</span>
                      <span className="text-white text-sm">{new Date(result.recoveredData.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                      <span className="text-slate-400 text-sm">Verified Hash</span>
                      <span className="text-white font-mono text-xs">{result.recoveredData.hash}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Recovery Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-400">
            <div className="flex gap-3">
              <span className="text-orange-400">1.</span>
              <span>Retrieve encrypted data from blockchain</span>
            </div>
            <div className="flex gap-3">
              <span className="text-orange-400">2.</span>
              <span>Decrypt using AES encryption key</span>
            </div>
            <div className="flex gap-3">
              <span className="text-orange-400">3.</span>
              <span>Verify data integrity with hash</span>
            </div>
            <div className="flex gap-3">
              <span className="text-orange-400">4.</span>
              <span>Restore original data to database</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Recovery Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Total Recoveries</span>
              <span className="text-white text-sm">
                {loadingStats ? '...' : stats.totalCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Success Rate</span>
              <span className="text-emerald-400 text-sm">
                {loadingStats ? '...' : `${stats.successRate}%`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Last Recovery</span>
              <span className="text-white text-sm">
                {loadingStats ? '...' : (stats.lastRecovery ? new Date(stats.lastRecovery).toLocaleString() : 'Never')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RecoveryPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <RefreshCw className="w-10 h-10 text-orange-400 shadow-lg shadow-orange-500/20 animate-spin" />
          <div>
            <h1 className="text-4xl font-bold text-white">Recovery Engine</h1>
            <p className="text-slate-400 mt-1">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <RecoveryContent />
    </Suspense>
  );
}
