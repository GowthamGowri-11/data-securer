'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Database, Search, Edit, Save, X, AlertTriangle, RefreshCw, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SensorDataRecord {
  id: string;
  dataType: string;
  dataValue: string;
  timestamp: string;
  hash: string;
  blockchainTxHash: string;
  createdAt: string;
}

export default function DatabaseManagementPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<SensorDataRecord[]>([]);
  const [searchId, setSearchId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sensor-data', {
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch records');
      }

      setRecords(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record: SensorDataRecord) => {
    setEditingId(record.id);
    setEditValue(record.dataValue);
    setSuccess(null);
    setError(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleSave = async (recordId: string) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/database-management', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({
          dataId: recordId,
          newValue: editValue,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update record');
      }

      setSuccess('Data tampered successfully! Hash mismatch will be detected on verification.');
      setEditingId(null);
      setEditValue('');
      
      // Refresh records
      await fetchRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = (dataId: string) => {
    window.location.href = `/verification?dataId=${dataId}`;
  };

  const handleRecover = (dataId: string) => {
    window.location.href = `/recovery?dataId=${dataId}`;
  };

  const filteredRecords = useMemo(() => {
    return records.filter(record => 
      record.id.toLowerCase().includes(searchId.toLowerCase()) ||
      record.dataType.toLowerCase().includes(searchId.toLowerCase()) ||
      record.dataValue.toLowerCase().includes(searchId.toLowerCase())
    );
  }, [records, searchId]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Database className="w-10 h-10 text-purple-400 shadow-lg shadow-purple-500/20" />
        <div>
          <h1 className="text-4xl font-bold text-white">Database Management</h1>
          <p className="text-slate-400 mt-1">View and modify sensor data records (simulates tampering)</p>
        </div>
      </div>

      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Search Records</CardTitle>
          <CardDescription className="text-slate-400">
            Find records by Data ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                placeholder="Enter Data ID to search..."
              />
            </div>
            <button
              onClick={fetchRecords}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-red-500/30 bg-red-500/10">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-center gap-3 text-emerald-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">{success}</span>
          </div>
        </div>
      )}

      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">All Records ({filteredRecords.length})</CardTitle>
          <CardDescription className="text-slate-400">
            Click Edit to modify data values and simulate tampering
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
              <p>Loading records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No records found</p>
              <p className="text-sm mt-2">Submit some sensor data first</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="bg-slate-800/50 p-5 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-all"
                >
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Data ID</p>
                      <p className="text-white font-mono text-sm break-all">{record.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Data Type</p>
                      <p className="text-white font-semibold">{record.dataType}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Data Value</p>
                      {editingId === record.id ? (
                        <Input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="bg-slate-900/50 border-yellow-500/50 text-white"
                          placeholder="Enter new value to tamper..."
                        />
                      ) : (
                        <p className="text-cyan-400 font-semibold text-lg">{record.dataValue}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Timestamp</p>
                      <p className="text-white text-sm">{new Date(record.timestamp).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-1">Hash (SHA-256)</p>
                    <p className="text-white font-mono text-xs break-all">{record.hash}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {editingId === record.id ? (
                      <>
                        <button
                          onClick={() => handleSave(record.id)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold transition-all disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? 'Saving...' : 'Save (Tamper Data)'}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(record)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold transition-all"
                        >
                          <Edit className="w-4 h-4" />
                          Edit (Tamper)
                        </button>
                        <button
                          onClick={() => handleVerify(record.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold transition-all"
                        >
                          <Shield className="w-4 h-4" />
                          Verify
                        </button>
                        <button
                          onClick={() => handleRecover(record.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold transition-all"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Recover
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 backdrop-blur-sm border-yellow-500/30 bg-yellow-500/10">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Testing Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <div className="flex gap-3">
            <span className="text-yellow-400 font-bold">1.</span>
            <span>Submit sensor data on the Sensor Data page</span>
          </div>
          <div className="flex gap-3">
            <span className="text-yellow-400 font-bold">2.</span>
            <span>Find the record here and click "Edit (Tamper)"</span>
          </div>
          <div className="flex gap-3">
            <span className="text-yellow-400 font-bold">3.</span>
            <span>Change the data value and click "Save (Tamper Data)"</span>
          </div>
          <div className="flex gap-3">
            <span className="text-yellow-400 font-bold">4.</span>
            <span>Click "Verify" to detect the tampering (hash mismatch)</span>
          </div>
          <div className="flex gap-3">
            <span className="text-yellow-400 font-bold">5.</span>
            <span>Click "Recover" to restore original data from blockchain</span>
          </div>
          <div className="flex gap-3">
            <span className="text-yellow-400 font-bold">6.</span>
            <span>Verify again to confirm data integrity is restored</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
