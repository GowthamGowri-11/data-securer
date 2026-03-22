'use client';

import Link from 'next/link';
import { Shield, LogOut, User, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  return (
    <nav className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-wider">
              DATA SECURER
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Badge variant="outline" className="border-emerald-500 text-emerald-400 bg-emerald-500/10">
              System Active
            </Badge>
            
            {isAuthenticated && user && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700">
                  {user.picture ? (
                    <img 
                      src={user.picture} 
                      alt={user.username}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : isAdmin ? (
                    <Crown className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <User className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="text-sm text-slate-300 font-medium">
                    {user.username}
                    {isAdmin && <span className="text-yellow-400 ml-1">(Admin)</span>}
                  </span>
                </div>
                
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
