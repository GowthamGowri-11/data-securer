import { Shield, AlertTriangle, Loader2 } from 'lucide-react';

interface IntegrityIndicatorProps {
  status: 'secure' | 'compromised' | 'checking';
}

export default function IntegrityIndicator({ status }: IntegrityIndicatorProps) {
  const statusConfig = {
    secure: {
      color: 'green',
      text: 'Data Secure',
      icon: Shield,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      glow: 'glow-green',
    },
    compromised: {
      color: 'red',
      text: 'Tampering Detected',
      icon: AlertTriangle,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      glow: 'glow-red',
    },
    checking: {
      color: 'blue',
      text: 'Verifying...',
      icon: Loader2,
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      glow: 'glow-blue',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`glass-card px-6 py-3 rounded-full border ${config.borderColor} ${config.bgColor} ${config.glow} flex items-center gap-3`}>
      <div className={`w-3 h-3 bg-${config.color}-500 rounded-full ${status === 'checking' ? 'animate-pulse' : ''}`}></div>
      <Icon className={`w-5 h-5 ${config.textColor} ${status === 'checking' ? 'animate-spin' : ''}`} />
      <span className={`${config.textColor} font-semibold`}>{config.text}</span>
    </div>
  );
}
