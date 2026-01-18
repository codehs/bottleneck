import { useUIStore } from "../../stores/uiStore";
import { cn } from "../../utils/cn";

interface StatsFiltersBarProps {
  timeRange: 'week' | 'month' | 'quarter' | 'all';
  onTimeRangeChange: (range: 'week' | 'month' | 'quarter' | 'all') => void;
}

export function StatsFiltersBar({
  timeRange,
  onTimeRangeChange,
}: StatsFiltersBarProps) {
  const { theme } = useUIStore();

  const timeRanges = [
    { label: 'Last 7 days', value: 'week' as const },
    { label: 'Last 30 days', value: 'month' as const },
    { label: 'Last 90 days', value: 'quarter' as const },
    { label: 'All time', value: 'all' as const },
  ];

  return (
    <div
      className={cn(
        "flex gap-4 p-4 rounded-lg",
        theme === "dark"
          ? "bg-gray-800 border border-gray-700"
          : "bg-gray-50 border border-gray-200"
      )}
    >
      {/* Time Range Selector */}
      <div className="flex gap-2">
        <span className={cn(
          "text-sm font-medium self-center",
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        )}>
          Time Range:
        </span>
        {timeRanges.map((range) => (
          <button
            key={range.value}
            onClick={() => onTimeRangeChange(range.value)}
            className={cn(
              "px-3 py-2 rounded text-sm font-medium transition-colors",
              timeRange === range.value
                ? theme === "dark"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-500 text-white"
                : theme === "dark"
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            )}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
