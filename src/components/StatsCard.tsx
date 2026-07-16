import * as Icons from 'lucide-react';

interface StatsCardProps {
  icon: keyof typeof Icons;
  label: string;
  value: string | number;
  gradient: string;
}

export function StatsCard({ icon, label, value, gradient }: StatsCardProps) {
  const IconComponent = (Icons[icon] as typeof Icons.Sparkles) || Icons.Sparkles;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <IconComponent className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-800">{value}</div>
          <div className="text-sm font-medium text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}
