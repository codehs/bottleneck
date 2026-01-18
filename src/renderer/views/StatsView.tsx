import { useEffect, useMemo } from "react";
import { usePRStore } from "../stores/prStore";
import { useStatsStore } from "../stores/statsStore";
import { useUIStore } from "../stores/uiStore";
import { cn } from "../utils/cn";
import { StatsOverview } from "../components/stats/StatsOverview";
import { RepoStatsSection } from "../components/stats/RepoStatsSection";
import { PersonStatsSection } from "../components/stats/PersonStatsSection";
import { ReviewerStatsSection } from "../components/stats/ReviewerStatsSection";
import { StatsFiltersBar } from "../components/stats/StatsFiltersBar";

export default function StatsView() {
  const { theme } = useUIStore();
  const { pullRequests, selectedRepo } = usePRStore();
  const { calculateStats, filters, setTimeRange, setSelectedRepos, getFilteredStats } = useStatsStore();
  const selectedRepoKey = useMemo(() => {
    if (!selectedRepo) return null;
    return `${selectedRepo.owner}/${selectedRepo.name}`;
  }, [selectedRepo]);

  useEffect(() => {
    calculateStats(pullRequests);
  }, [pullRequests, filters.timeRange, filters.selectedRepos, calculateStats]);

  useEffect(() => {
    if (selectedRepoKey) {
      setSelectedRepos([selectedRepoKey]);
    } else {
      setSelectedRepos([]);
    }
  }, [selectedRepoKey, setSelectedRepos]);

  const filteredStats = useMemo(() => {
    return getFilteredStats();
  }, [filters, getFilteredStats]);

  return (
    <div
      className={cn(
        "flex-1 overflow-auto",
        theme === "dark"
          ? "bg-gray-900 text-gray-100"
          : "bg-white text-gray-900"
      )}
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">PR Statistics</h1>
          <p className={cn(
            "mt-2",
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          )}>
            {selectedRepo
              ? `Insights for ${selectedRepo.full_name ?? `${selectedRepo.owner}/${selectedRepo.name}`}`
              : "Select a repository to view metrics"}
          </p>
        </div>

        {/* Filters */}
        <StatsFiltersBar
          timeRange={filters.timeRange}
          onTimeRangeChange={setTimeRange}
        />

        {selectedRepo ? (
          <>
            {/* Overview Cards */}
            <StatsOverview stats={filteredStats} />

            {/* Main Stats Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Repository Stats */}
              <RepoStatsSection repos={filteredStats.repos} />

              {/* Reviewer Stats */}
              <ReviewerStatsSection reviewers={filteredStats.reviewers} />
            </div>

            {/* Person Stats - Full Width */}
            <PersonStatsSection people={filteredStats.people} />
          </>
        ) : (
          <div
            className={cn(
              "rounded-lg border border-dashed p-10 text-center",
              theme === "dark"
                ? "border-gray-700 text-gray-400"
                : "border-gray-200 text-gray-500"
            )}
          >
            Choose a repository from the top bar to see stats.
          </div>
        )}
      </div>
    </div>
  );
}
