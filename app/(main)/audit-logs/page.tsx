'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuditLogEntry {
  id: string;
  eventType: string;
  dataId: string;
  details: string;
  timestamp: string;
}

interface LogSummary {
  total: number;
  verified: number;
  tampered: number;
  recovered: number;
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [summary, setSummary] = useState<LogSummary>({
    total: 0,
    verified: 0,
    tampered: 0,
    recovered: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/audit-logs', {
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setLogs(result.data || []);
        
        // Calculate summary from the API summary or data
        const counts = result.summary?.byEventType || {};
        setSummary({
          total: result.totalCount || 0,
          verified: counts['VERIFICATION_PASSED'] || 0,
          tampered: counts['TAMPER_DETECTED'] || 0,
          recovered: (counts['RECOVERY_SUCCESS'] || 0) + (counts['DELETED_DATA_RECOVERED'] || 0)
        });
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.dataId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'VERIFICATION_PASSED':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Verified</Badge>;
      case 'TAMPER_DETECTED':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Tampered</Badge>;
      case 'RECOVERY_SUCCESS':
      case 'DELETED_DATA_RECOVERED':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Recovered</Badge>;
      case 'DATA_SUBMITTED':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Submitted</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-400">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <FileText className="w-10 h-10 text-green-400 glow-green" />
        <div>
          <h1 className="text-4xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-400 mt-1">Complete history of all system events and tampering detection</p>
        </div>
      </div>

      <Card className="glass-card border-white/10">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="text-white">Event History</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-card border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Data ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                        <span>Loading audit logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="w-12 h-12 text-gray-600" />
                        <span className="text-gray-500">{searchTerm ? 'No logs match your search' : 'No audit logs yet'}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEventBadge(log.eventType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {log.dataId.slice(0, 12)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Events</p>
                <p className="text-2xl font-bold text-white mt-1">{loading ? '...' : summary.total}</p>
              </div>
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                All
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Verified</p>
                <p className="text-2xl font-bold text-white mt-1">{loading ? '...' : summary.verified}</p>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-400">
                Success
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tampered</p>
                <p className="text-2xl font-bold text-white mt-1">{loading ? '...' : summary.tampered}</p>
              </div>
              <Badge variant="outline" className="border-red-500 text-red-400">
                Alert
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Recovered</p>
                <p className="text-2xl font-bold text-white mt-1">{loading ? '...' : summary.recovered}</p>
              </div>
              <Badge variant="outline" className="border-purple-500 text-purple-400">
                Restored
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
