import { Tag, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../../utils/cn";
import { PullRequest } from "../../services/github";
import { AddLabelDialog } from "./AddLabelDialog";
import { useLabelStore } from "../../stores/labelStore";
import { useUIStore } from "../../stores/uiStore";
import { usePRStore } from "../../stores/prStore";
import { useAuthStore } from "../../stores/authStore";
import { getLabelColors } from "../../utils/labelColors";

interface LabelsSidebarProps {
  pr: PullRequest;
  theme: "light" | "dark";
}

export function LabelsSidebar({
  pr,
  theme,
}: LabelsSidebarProps) {
  const { addLabelDialogOpen, setAddLabelDialogOpen } = useUIStore();
  const { token } = useAuthStore();
  const [availableLabels, setAvailableLabels] = useState<
    Array<{ name: string; color: string; description?: string | null }>
  >([]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);

  const addLabelAsync = async (labelName: string) => {
    const { GitHubAPI } = await import("../../services/github");
    const { usePRStore } = await import("../../stores/prStore");

    const api = new GitHubAPI(token);

    // Make API call to add label
    await api.addLabels(
      pr.base.repo.owner.login,
      pr.base.repo.name,
      pr.number,
      [labelName]
    );

    // Update the store
    const prStore = usePRStore.getState();
    const key = `${pr.base.repo.owner.login}/${pr.base.repo.name}#${pr.number}`;
    const currentPR = prStore.pullRequests.get(key);

    if (currentPR) {
      const updatedPR = {
        ...currentPR,
        labels: [
          ...currentPR.labels,
          {
            name: labelName,
            color: availableLabels.find((l) => l.name === labelName)?.color || "0366d6",
          },
        ],
      };
      prStore.updatePR(updatedPR);
    }
  };

  const handleAddLabel = async (labelName: string) => {
    try {
      await addLabelAsync(labelName);
    } catch (error) {
      console.error("Failed to add label:", error);
    }
  };

  // Fetch labels when dialog opens (cached by labelStore)
  useEffect(() => {
    if (addLabelDialogOpen && pr.base.repo.owner.login && pr.base.repo.name) {
      setIsLoadingLabels(true);
      (async () => {
        try {
          const { fetchLabels } = useLabelStore.getState();
          const labels = await fetchLabels(
            pr.base.repo.owner.login,
            pr.base.repo.name
          );
          setAvailableLabels(labels);
        } catch (error) {
          console.error("Failed to fetch labels:", error);
        } finally {
          setIsLoadingLabels(false);
        }
      })();
    }
  }, [addLabelDialogOpen, pr.base.repo.owner.login, pr.base.repo.name]);

  const currentLabelNames = new Set(pr.labels.map((l) => l.name));

  return (
    <div
      className={cn(
        "w-80 border-l overflow-y-auto",
        theme === "dark"
          ? "bg-gray-900 border-gray-700"
          : "bg-gray-50 border-gray-200",
      )}
    >
      <div className="p-4 space-y-6">
        {/* Header with Add Label Button */}
        <div className="flex items-center justify-between mb-2">
          <h3
            className={cn(
              "text-sm font-semibold flex items-center",
              theme === "dark" ? "text-gray-300" : "text-gray-700",
            )}
          >
            <Tag className="w-4 h-4 mr-2" />
            Labels
          </h3>
          <button
            onClick={() => setAddLabelDialogOpen(true)}
            className={cn(
              "p-1 rounded transition-colors",
              theme === "dark"
                ? "hover:bg-gray-800 text-gray-400 hover:text-blue-400"
                : "hover:bg-gray-200 text-gray-500 hover:text-blue-600",
            )}
            title="Add label"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Labels List */}
        {pr.labels.length > 0 ? (
          <div className="space-y-2">
            {pr.labels.map((label) => {
              const { bgColor, textColor } = getLabelColors(label.color, theme);

              return (
                <div
                  key={label.name}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium truncate",
                    bgColor,
                    textColor
                  )}
                  title={label.name}
                >
                  {label.name}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className={cn(
              "text-xs text-center py-4",
              theme === "dark" ? "text-gray-500" : "text-gray-400",
            )}
          >
            No labels yet
          </div>
        )}
      </div>

      {/* Add Label Dialog */}
      <AddLabelDialog
        isOpen={addLabelDialogOpen}
        onClose={() => setAddLabelDialogOpen(false)}
        onSelect={handleAddLabel}
        availableLabels={availableLabels}
        selectedLabels={Array.from(currentLabelNames)}
        theme={theme}
        isLoadingLabels={isLoadingLabels}
      />
    </div>
  );
}
