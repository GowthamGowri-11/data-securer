'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SensorDataItem {
  id: string;
  dataType: string;
  dataValue: string;
  timestamp: string;
  hash: string;
  blockchainTxHash: string;
}

export default function DataTable() {
  const { user } = useAuth();
  const [data, setData] = useState<SensorDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/sensor-data', {
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch sensor data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Data Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Hash
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-white/10">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Data Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Value
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Timestamp
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Hash
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">📊</span>
                  <span>No data available</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="hover:bg-white/5">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                  {item.id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {item.dataType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {item.dataValue}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {new Date(item.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                  {item.hash}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
