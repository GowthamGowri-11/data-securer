import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <Navbar />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-8">{children}</main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
