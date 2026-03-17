'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, Shield, RefreshCw, FileText, Settings } from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sensor-data', label: 'Sensor Data', icon: Database },
  { href: '/verification', label: 'Verification', icon: Shield },
  { href: '/recovery', label: 'Recovery', icon: RefreshCw },
  { href: '/database-management', label: 'DB Management', icon: Settings },
  { href: '/audit-logs', label: 'Audit Logs', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 min-h-screen p-4">
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-8 p-4 bg-slate-900/50 rounded-lg border border-emerald-500/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-emerald-400 font-semibold">System Status</span>
        </div>
        <p className="text-xs text-slate-400">All systems operational</p>
      </div>
    </aside>
  );
}
