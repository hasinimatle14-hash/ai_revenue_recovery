import React from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'neutral';
  text: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, text, className = '' }) => {
  const getStatusColors = () => {
    switch (status) {
      case 'online':
        return {
          bg: 'bg-emerald-500',
          ring: 'ring-emerald-400/30',
          text: 'text-emerald-700'
        };
      case 'offline':
        return {
          bg: 'bg-rose-500',
          ring: 'ring-rose-400/30',
          text: 'text-rose-700'
        };
      case 'warning':
        return {
          bg: 'bg-amber-500',
          ring: 'ring-amber-400/30',
          text: 'text-amber-700'
        };
      case 'neutral':
      default:
        return {
          bg: 'bg-slate-400',
          ring: 'ring-slate-300/30',
          text: 'text-slate-500'
        };
    }
  };

  const colors = getStatusColors();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm bg-white/60 border border-slate-100/50 shadow-sm ${className}`}>
      <span className="relative flex h-2 w-2">
        {status === 'online' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.bg}`}></span>
      </span>
      <span className={`font-medium ${colors.text}`}>{text}</span>
    </div>
  );
};
