export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse text-transparent">
      <div className="flex items-center justify-between">
        <div className="h-10 w-48 bg-slate-800 rounded-lg"></div>
        <div className="h-8 w-32 bg-slate-800 rounded-full"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-900/50 border border-slate-800 rounded-xl"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-slate-900/50 border border-slate-800 rounded-xl"></div>
        <div className="h-64 bg-slate-900/50 border border-slate-800 rounded-xl"></div>
      </div>

      <div className="h-96 bg-slate-900/50 border border-slate-800 rounded-xl"></div>
    </div>
  );
}
