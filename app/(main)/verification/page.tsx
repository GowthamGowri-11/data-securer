'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Shield, CheckCircle, AlertTriangle, Loader2, RefreshCw, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function VerificationPage() {
  const { user } = useAuth();
  const [dataId, setDataId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCount: 0,
    tamperedCount: 0,
    lastVerification: null as string | null
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
      // We can get verification stats from the audit-logs summary or a specific verify stats endpoint if it exists
      // The /api/verify GET endpoint provides stats
      const response = await fetch('/api/verify', {
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
      console.error('Failed to fetch verification stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleVerify = async () => {
    if (!dataId.trim()) {
      setError('Please enter a Data ID');
      return;
    }

    setIsVerifying(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({ dataId: dataId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRecoverClick = (dataId: string) => {
    // Navigate to recovery page with data ID
    window.location.href = `/recovery?dataId=${dataId}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Shield className="w-10 h-10 text-cyan-400 shadow-lg shadow-cyan-500/20" />
        <div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight">Data Integrity Engine</h1>
          <p className="text-slate-400 mt-1">Verify data integrity between database and blockchain</p>
        </div>
      </div>

      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Integrity Check</CardTitle>
          <CardDescription className="text-slate-400">
            Compare database hashes with blockchain records to detect tampering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Data ID
            </label>
            <Input
              type="text"
              value={dataId}
              onChange={(e) => setDataId(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              placeholder="Enter data ID to verify (e.g., uuid-from-submission)"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
            <p className="text-xs text-slate-500 mt-1">Enter the Data ID you received when submitting data</p>
          </div>

          <button
            onClick={handleVerify}
            disabled={isVerifying || !dataId.trim()}
            className="w-full inline-flex items-center justify-center h-14 px-8 rounded-lg text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verifying Data Integrity...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Run Integrity Check
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

          {result && (
            <div className={`bg-slate-900/50 p-6 rounded-lg border ${
              result.isValid 
                ? 'border-emerald-500/30 bg-emerald-500/10' 
                : 'border-red-500/30 bg-red-500/10'
            }`}>
              <div className="flex items-start gap-4">
                {result.isValid ? (
                  <CheckCircle className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${
                    result.isValid ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {result.isValid ? 'Verification Successful' : 'Tampering Detected!'}
                  </h3>
                  <p className="text-slate-300 mb-4">{result.message}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                      <span className="text-slate-400 text-sm">Data ID</span>
                      <span className="text-white font-mono text-xs">{result.dataId}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                      <span className="text-slate-400 text-sm">Database Hash</span>
                      <span className="text-white font-mono text-xs">{result.databaseHash}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                      <span className="text-slate-400 text-sm">Blockchain Hash</span>
                      <span className="text-white font-mono text-xs">{result.blockchainHash}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                      <span className="text-slate-400 text-sm">Verified At</span>
                      <span className="text-white text-xs">{new Date(result.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Show recovery button if tampered */}
                  {!result.isValid && (
                    <button
                      onClick={() => handleRecoverClick(result.dataId)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold transition-all shadow-lg shadow-orange-500/20"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Recover This Data
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-400">
            <div className="flex gap-3">
              <span className="text-cyan-400">1.</span>
              <span>Retrieve data from MongoDB database</span>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400">2.</span>
              <span>Compute SHA-256 hash of current data</span>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400">3.</span>
              <span>Fetch original hash from blockchain</span>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400">4.</span>
              <span>Compare hashes to detect tampering</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Verification Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Last Check</span>
              <span className="text-white text-sm">
                {loadingStats ? '...' : (stats.lastVerification ? new Date(stats.lastVerification).toLocaleString() : 'Never')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Total Verifications</span>
              <span className="text-white text-sm">
                {loadingStats ? '...' : stats.totalCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Tampering Events</span>
              <span className="text-red-400 text-sm font-semibold">
                {loadingStats ? '...' : stats.tamperedCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
