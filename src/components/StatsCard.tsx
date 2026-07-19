import * as Icons from 'lucide-react';

interface StatsCardProps {
  icon: keyof typeof Icons;
  label: string;
  value: string | number;
  gradient: string;
}

export function StatsCard({ icon, label, value, gradient }: StatsCardProps) {
  const IconComponent = (Icons[icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 shadow-md border border-gray-100 dark:border-purple-900/40 hover:shadow-lg transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <IconComponent className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-800 dark:text-purple-100">{value}</div>
          <div className="text-xs font-medium text-gray-500 dark:text-purple-300/60">{label}</div>
        </div>
      </div>
    </div>
  );
}
