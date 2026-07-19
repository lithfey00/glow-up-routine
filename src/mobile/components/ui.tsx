import type { ReactNode } from 'react';

export function GlassCard({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-purple-900/40 shadow-lg shadow-pink-100/40 dark:shadow-black/20 ${className}`}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-200/70 dark:bg-slate-700/50 ${className}`} />;
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-pink-100 to-violet-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-gray-700 dark:text-purple-100 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 dark:text-purple-300/60 max-w-xs">{subtitle}</p>}
    </div>
  );
}
