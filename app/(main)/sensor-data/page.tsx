'use client';

import DataInputForm from '@/components/DataInputForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Database } from 'lucide-react';

export default function SensorDataPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Database className="w-10 h-10 text-blue-400 glow-blue" />
        <div>
          <h1 className="text-4xl font-bold text-white">Sensor Data Input</h1>
          <p className="text-gray-400 mt-1">Manually enter sensor readings for blockchain storage</p>
        </div>
      </div>
      
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Enter Sensor Data</CardTitle>
          <CardDescription className="text-gray-400">
            Data will be hashed, encrypted, and stored on the blockchain for tamper detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataInputForm />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-lg border border-blue-500/30">
          <div className="text-2xl mb-2">🔐</div>
          <h3 className="text-white font-semibold mb-1">SHA-256 Hash</h3>
          <p className="text-xs text-gray-400">Cryptographic integrity verification</p>
        </div>
        <div className="glass-card p-4 rounded-lg border border-purple-500/30">
          <div className="text-2xl mb-2">🔒</div>
          <h3 className="text-white font-semibold mb-1">AES Encryption</h3>
          <p className="text-xs text-gray-400">Secure data protection</p>
        </div>
        <div className="glass-card p-4 rounded-lg border border-green-500/30">
          <div className="text-2xl mb-2">⛓️</div>
          <h3 className="text-white font-semibold mb-1">Blockchain Storage</h3>
          <p className="text-xs text-gray-400">Immutable record keeping</p>
        </div>
      </div>
    </div>
  );
}
