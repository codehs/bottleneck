import { useUIStore } from "../../stores/uiStore";
import { cn } from "../../utils/cn";
import { ChevronDown, Plus, Search, X } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

interface FeedControlsProps {
  displayedRepos: string[];
  availableRepos: string[];
  onToggleRepo: (repoKey: string) => void;
}

export function FeedControls({
  displayedRepos,
  availableRepos,
  onToggleRepo,
}: FeedControlsProps) {
  const { theme } = useUIStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [showDropdown]);

  // Filter repos based on search query
  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableRepos;
    }

    const query = searchQuery.toLowerCase();
    return availableRepos.filter((repo) => {
      return repo.toLowerCase().includes(query);
    });
  }, [availableRepos, searchQuery]);

  const canAddMore = displayedRepos.length < 4;
  const availableToAdd = filteredRepos.filter((r) => !displayedRepos.includes(r));

  return (
    <div className={cn(
      "border-b px-6 py-3 flex items-center justify-between",
      theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"
    )}>
      <div className="flex items-center gap-3 flex-wrap">
        {displayedRepos.map((repo) => (
          <div
            key={repo}
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium",
              theme === "dark"
                ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                : "bg-blue-100 text-blue-700 border border-blue-200"
            )}
          >
            <span className="text-xs opacity-75">{repo.split('/')[0]}/</span>
            {repo.split('/')[1]}
            <button
              onClick={() => onToggleRepo(repo)}
              className="hover:opacity-70"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {canAddMore && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors",
              theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            )}
          >
            <Plus size={16} />
            Add ({displayedRepos.length}/4)
            <ChevronDown size={14} />
          </button>

          {showDropdown && (
            <div
              className={cn(
                "absolute right-0 mt-2 w-64 rounded-lg shadow-lg z-50 max-h-80 flex flex-col",
                theme === "dark"
                  ? "bg-gray-700 border border-gray-600"
                  : "bg-white border border-gray-200"
              )}
            >
              {/* Search input */}
              <div className="p-3 border-b sticky top-0" style={{
                borderColor: theme === "dark" ? "#525252" : "#e5e7eb"
              }}>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded",
                  theme === "dark"
                    ? "bg-gray-600 border border-gray-500"
                    : "bg-gray-50 border border-gray-300"
                )}>
                  <Search size={16} className={theme === "dark" ? "text-gray-400" : "text-gray-500"} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search repos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "flex-1 bg-transparent outline-none text-sm",
                      theme === "dark"
                        ? "text-gray-200 placeholder-gray-400"
                        : "text-gray-900 placeholder-gray-500"
                    )}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className={cn(
                        "p-1 rounded hover:bg-gray-400/20",
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      )}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtered repos list */}
              <div className="flex-1 overflow-y-auto">
                {availableToAdd.length === 0 ? (
                  <div className={cn(
                    "px-3 py-4 text-center text-sm",
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  )}>
                    {filteredRepos.length === 0 ? "No repositories found" : "All repositories selected"}
                  </div>
                ) : (
                  availableToAdd.map((repo) => (
                    <button
                      key={repo}
                      onClick={() => {
                        onToggleRepo(repo);
                        setShowDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm transition-colors",
                        theme === "dark"
                          ? "hover:bg-gray-600 text-gray-200"
                          : "hover:bg-gray-100"
                      )}
                    >
                      <span className="text-xs opacity-75">{repo.split('/')[0]}/</span>
                      {repo.split('/')[1]}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
