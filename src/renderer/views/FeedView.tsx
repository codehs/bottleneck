import { useEffect, useMemo, useState } from "react";
import { usePRStore } from "../stores/prStore";
import { useActivityStore } from "../stores/activityStore";
import { useUIStore } from "../stores/uiStore";
import { cn } from "../utils/cn";
import { FeedColumn } from "../components/feed/FeedColumn";
import { FeedControls } from "../components/feed/FeedControls";

export default function FeedView() {
  const { theme } = useUIStore();
  const { pullRequests, repositories } = usePRStore();
  const { 
    generateActivitiesFromPRs, 
    selectedRepos, 
    setSelectedRepos,
    loadSelectedRepos,
    autoUpdate
  } = useActivityStore();

  const [displayedRepos, setDisplayedRepos] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Load saved repos on mount
  useEffect(() => {
    const initialize = async () => {
      await loadSelectedRepos();
      setIsInitializing(false);
    };
    initialize();
  }, [loadSelectedRepos]);

  // Generate activities whenever PRs change
  useEffect(() => {
    generateActivitiesFromPRs(pullRequests);
  }, [pullRequests, generateActivitiesFromPRs]);

  // Sync displayedRepos with selectedRepos from store
  useEffect(() => {
    if (!isInitializing && selectedRepos.length > 0) {
      setDisplayedRepos(selectedRepos);
    }
  }, [selectedRepos, isInitializing]);

  // Initialize with first repo if none saved
  useEffect(() => {
    if (!isInitializing && displayedRepos.length === 0 && repositories.length > 0) {
      const firstRepo = `${repositories[0].owner}/${repositories[0].name}`;
      const newRepos = [firstRepo];
      setDisplayedRepos(newRepos);
      setSelectedRepos(newRepos);
    }
  }, [repositories, displayedRepos.length, isInitializing, setSelectedRepos]);

  // Handle repo selection
  const handleToggleRepo = (repoKey: string) => {
    setDisplayedRepos((prev) => {
      let newRepos: string[];
      if (prev.includes(repoKey)) {
        newRepos = prev.filter((r) => r !== repoKey);
      } else if (prev.length < 4) {
        newRepos = [...prev, repoKey];
      } else {
        return prev;
      }
      // Persist to store
      setSelectedRepos(newRepos);
      return newRepos;
    });
  };

  const availableReposForSelection = useMemo(() => {
    return repositories
      .map((r) => `${r.owner}/${r.name}`)
      .sort((a, b) => a.localeCompare(b));
  }, [repositories]);

  return (
    <div
      className={cn(
        "flex-1 overflow-hidden flex flex-col",
        theme === "dark"
          ? "bg-gray-900 text-gray-100"
          : "bg-white text-gray-900"
      )}
    >
      {/* Header */}
      <div className={cn(
        "border-b px-6 py-4",
        theme === "dark" ? "border-gray-700" : "border-gray-200"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Activity Feed</h1>
            <p className={cn(
              "mt-1 text-sm",
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            )}>
              Real-time updates from your repositories
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <FeedControls
        displayedRepos={displayedRepos}
        availableRepos={availableReposForSelection}
        onToggleRepo={handleToggleRepo}
      />

      {/* Feed Columns */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4">
        {displayedRepos.length === 0 ? (
          <div className="flex items-center justify-center w-full">
            <div className={cn(
              "text-center",
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            )}>
              <p className="text-lg font-semibold mb-2">No repositories selected</p>
              <p className="text-sm">Select up to 4 repositories to view their activity</p>
            </div>
          </div>
        ) : (
          displayedRepos.map((repoKey) => (
            <FeedColumn
              key={repoKey}
              repoKey={repoKey}
              onRemove={() => handleToggleRepo(repoKey)}
            />
          ))
        )}
      </div>
    </div>
  );
}
