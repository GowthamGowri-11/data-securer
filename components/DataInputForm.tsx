'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Thermometer, Clock, Hash, Database, CheckCircle, FileText, Copy, ExternalLink, X } from 'lucide-react';

export default function DataInputForm() {
  const { user } = useAuth();
  const [dataType, setDataType] = useState('');
  const [dataValue, setDataValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSubmittedData(null);
    
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/sensor-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        body: JSON.stringify({
          dataType,
          dataValue,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit data');
      }

      setShowSuccess(true);
      setSubmittedData(result.data);
      // Don't clear form or hide success - let user manually dismiss or copy ID
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNewSubmission = () => {
    setShowSuccess(false);
    setSubmittedData(null);
    setDataType('');
    setDataValue('');
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Data Type
          </label>
          <Input
            type="text"
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
            placeholder="e.g., Temperature, Humidity, Pressure, Location, etc."
            required
          />
          <p className="text-xs text-slate-500 mt-1">Enter the type of sensor data you want to store</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Thermometer className="w-4 h-4 text-cyan-400" />
            Data Value
          </label>
          <Input
            type="text"
            value={dataValue}
            onChange={(e) => setDataValue(e.target.value)}
            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
            placeholder="Enter the sensor reading value"
            required
          />
          <p className="text-xs text-slate-500 mt-1">Can be number, text, or any sensor reading</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Timestamp
          </label>
          <Input
            type="text"
            value={new Date().toLocaleString()}
            disabled
            className="bg-slate-900/50 border-slate-700 text-slate-400 bg-slate-800/50"
          />
        </div>
      </div>

      <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-cyan-500/30">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Hash className="w-4 h-4 text-cyan-400" />
          <span>SHA-256 hash will be generated</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Database className="w-4 h-4 text-blue-400" />
          <span>Data will be stored on blockchain</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-6 text-lg font-semibold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Data'}
      </button>

      {error && (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-red-500/30 bg-red-500/10">
          <div className="flex items-center gap-3 text-red-400">
            <span className="font-semibold">Error: {error}</span>
          </div>
        </div>
      )}

      {showSuccess && submittedData && (
        <div className="bg-slate-900/50 p-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle className="w-6 h-6" />
              <span className="font-bold text-lg">Data submitted successfully!</span>
            </div>
            <button
              onClick={handleNewSubmission}
              className="text-slate-400 hover:text-white transition-colors"
              title="Submit new data"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="bg-slate-800/50 p-5 rounded-lg border-2 border-cyan-500/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-cyan-400 text-sm font-bold uppercase tracking-wide">⚠️ Important: Save This Data ID!</span>
                <button
                  onClick={() => copyToClipboard(submittedData.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    copied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                  }`}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm font-semibold">Copy ID</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-white font-mono text-base break-all bg-slate-900/50 p-3 rounded border border-slate-700">
                {submittedData.id}
              </p>
              <p className="text-xs text-slate-400 mt-3 flex items-center gap-2">
                <span className="text-yellow-400">💡</span>
                You'll need this ID for verification and recovery operations
              </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg">
              <span className="text-slate-400 text-sm font-semibold">Data Hash</span>
              <p className="text-white font-mono text-xs break-all mt-1">{submittedData.hash.slice(0, 32)}...</p>
            </div>

            {submittedData.blockchainTxHash && (
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm font-semibold">Blockchain Transaction</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${submittedData.blockchainTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    <span className="text-xs">View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-white font-mono text-xs break-all">{submittedData.blockchainTxHash.slice(0, 32)}...</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleNewSubmission}
              className="flex-1 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all"
            >
              Submit New Data
            </button>
            <button
              onClick={() => window.location.href = '/verification'}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold transition-all"
            >
              Verify This Data
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
