import type { ReactNode, CSSProperties } from 'react';

export function GlassCard({
  children,
  className = '',
  onClick,
  style,
  variant = 'default',
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
  variant?: 'default' | 'elevated' | 'sheen';
}) {
  const base = 'glass rounded-[28px] shadow-[0_8px_32px_-8px_rgba(236,72,153,0.12)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]';
  const variants = {
    default: '',
    elevated: 'shadow-[0_12px_40px_-8px_rgba(139,92,246,0.2)]',
    sheen: 'relative overflow-hidden',
  };
  return (
    <div
      onClick={onClick}
      style={style}
      className={`${base} ${variants[variant]} ${onClick ? 'pressable cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function Pressable({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`pressable ${className}`}
    >
      {children}
    </button>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-2xl ${className}`} />;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  emoji,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  emoji?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in-scale">
      <div className="relative mb-5">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200/40 to-violet-200/40 dark:from-purple-800/30 dark:to-pink-800/30 rounded-[32px] blur-xl" />
        <div className="relative w-20 h-20 rounded-[28px] bg-gradient-to-br from-pink-100 to-violet-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center">
          {emoji ? <span className="text-4xl animate-breathe">{emoji}</span> : icon}
        </div>
      </div>
      <h3 className="text-base font-bold text-gray-700 dark:text-purple-100 mb-1.5 font-quicksand">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 dark:text-purple-300/50 max-w-[16rem] leading-relaxed">{subtitle}</p>}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-1 mb-3">
      <h2 className="text-[17px] font-bold text-gray-800 dark:text-purple-100 font-quicksand tracking-tight">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-[13px] font-semibold text-pink-500 dark:text-pink-300 pressable">
          {action}
        </button>
      )}
    </div>
  );
}

export function Pill({
  children,
  active,
  onClick,
  gradient,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  gradient?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`pressable px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-300 ${
        active
          ? `${gradient || 'bg-gradient-to-r from-pink-500 to-violet-500'} text-white shadow-md shadow-pink-500/25`
          : 'bg-white/60 dark:bg-slate-800/50 text-gray-500 dark:text-purple-300/60 border border-black/5 dark:border-white/5'
      }`}
    >
      {children}
    </button>
  );
}

export function ProgressBar({
  value,
  gradient = 'from-violet-500 to-pink-500',
  height = 'h-2.5',
}: {
  value: number;
  gradient?: string;
  height?: string;
}) {
  return (
    <div className={`${height} bg-black/5 dark:bg-white/10 rounded-full overflow-hidden`}>
      <div
        className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-[800ms] ease-out`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
