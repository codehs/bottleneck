import { Tag, Plus } from "lucide-react";
import { cn } from "../../utils/cn";
import { getLabelColors } from "../../utils/labelColors";
import { PullRequest } from "../../services/github";
import { useUIStore } from "../../stores/uiStore";

interface PRLabelsProps {
  pr: PullRequest;
  theme: "light" | "dark";
}

export function PRLabels({ pr, theme }: PRLabelsProps) {
  const { setAddLabelDialogOpen } = useUIStore();

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center space-x-3">
        <Tag
          className={cn(
            "w-5 h-5",
            theme === "dark" ? "text-gray-400" : "text-gray-600",
          )}
        />
        <div className="flex flex-wrap gap-2 items-center flex-1">
          {pr.labels.map((label) => {
            const labelColors = getLabelColors(label.color, theme);
            return (
              <span
                key={label.name}
                className="px-3 py-1 rounded text-sm font-medium"
                style={{
                  backgroundColor: labelColors.backgroundColor,
                  color: labelColors.color,
                }}
              >
                {label.name}
              </span>
            );
          })}
          <button
            onClick={() => setAddLabelDialogOpen(true)}
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded transition-colors flex-shrink-0 ml-1",
              theme === "dark"
                ? "hover:bg-gray-700 text-gray-400 hover:text-blue-400"
                : "hover:bg-gray-200 text-gray-500 hover:text-blue-600",
            )}
            title="Add label"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
