interface StatusCardProps {
  title: string;
  value: string;
  icon: string;
  color?: 'emerald' | 'green' | 'red' | 'teal';
  trend?: string;
}

export default function StatusCard({ title, value, icon, color = 'emerald', trend }: StatusCardProps) {
  const colorClasses = {
    emerald: 'from-emerald-500 to-emerald-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    teal: 'from-teal-500 to-teal-600',
  };

  const glowClasses = {
    emerald: 'shadow-emerald-500/20',
    green: 'shadow-green-500/20',
    red: 'shadow-red-500/20',
    teal: 'shadow-teal-500/20',
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <div className={`text-2xl`}>{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-white">{value}</p>
        {trend && (
          <span className={`text-sm font-semibold ${
            trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${colorClasses[color]} shadow-lg ${glowClasses[color]}`}></div>
    </div>
  );
}
