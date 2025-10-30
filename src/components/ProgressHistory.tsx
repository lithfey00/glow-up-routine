import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProgressHistoryProps {
  userId: string;
}

interface DayData {
  date: string;
  count: number;
}

export function ProgressHistory({ userId }: ProgressHistoryProps) {
  const [history, setHistory] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [userId]);

  async function loadHistory() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('user_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .gte('completed_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error loading history:', error);
    } else {
      const dateMap: Record<string, number> = {};
      data?.forEach((item) => {
        const date = item.completed_at.split('T')[0];
        dateMap[date] = (dateMap[date] || 0) + 1;
      });

      const historyData: DayData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        historyData.push({
          date: dateStr,
          count: dateMap[dateStr] || 0,
        });
      }

      setHistory(historyData);
    }
    setLoading(false);
  }

  function getIntensityColor(count: number): string {
    if (count === 0) return 'bg-gray-100';
    if (count <= 2) return 'bg-green-200';
    if (count <= 5) return 'bg-green-400';
    if (count <= 10) return 'bg-green-600';
    return 'bg-green-700';
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
        <div className="flex items-center justify-center">
          <Icons.Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Icons.Calendar className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Activity History</h3>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-2">
        {history.map((day, index) => {
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = date.getDate();

          return (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1"
              title={`${day.date}: ${day.count} challenges completed`}
            >
              {index % 10 === 0 && (
                <div className="text-xs font-medium text-gray-400">{dayName}</div>
              )}
              <div
                className={`w-8 h-8 rounded-lg ${getIntensityColor(
                  day.count
                )} transition-all hover:scale-110 hover:shadow-md flex items-center justify-center`}
              >
                <span className="text-xs font-semibold text-gray-700">{dayNum}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-gray-100" />
          <div className="w-4 h-4 rounded bg-green-200" />
          <div className="w-4 h-4 rounded bg-green-400" />
          <div className="w-4 h-4 rounded bg-green-600" />
          <div className="w-4 h-4 rounded bg-green-700" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
