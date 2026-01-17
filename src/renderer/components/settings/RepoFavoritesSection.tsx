import { useEffect, useState } from "react";
import { usePRStore } from "../../stores/prStore";
import { useRepoFavoritesStore } from "../../stores/repoFavoritesStore";
import { useUIStore } from "../../stores/uiStore";
import { cn } from "../../utils/cn";
import { Star, GripVertical } from "lucide-react";

export function RepoFavoritesSection() {
  const { theme } = useUIStore();
  const { repositories } = usePRStore();
  const { 
    favorites, 
    addFavorite, 
    removeFavorite, 
    isFavorited,
    reorderFavorites,
    loadFavorites 
  } = useRepoFavoritesStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await loadFavorites();
      setIsInitialized(true);
    };
    init();
  }, [loadFavorites]);

  const handleToggleFavorite = (repoKey: string) => {
    if (isFavorited(repoKey)) {
      removeFavorite(repoKey);
    } else {
      addFavorite(repoKey);
    }
  };

  const handleDragStart = (repoKey: string) => {
    setDraggedItem(repoKey);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetRepo: string) => {
    if (!draggedItem || draggedItem === targetRepo) return;

    const fromIdx = favorites.findIndex((f) => f.repoKey === draggedItem);
    const toIdx = favorites.findIndex((f) => f.repoKey === targetRepo);

    if (fromIdx === -1 || toIdx === -1) return;

    const newOrder = [...favorites];
    [newOrder[fromIdx], newOrder[toIdx]] = [newOrder[toIdx], newOrder[fromIdx]];

    reorderFavorites(newOrder);
    setDraggedItem(null);
  };

  if (!isInitialized) {
    return (
      <div className="text-center py-8">
        <div className={cn(
          "text-sm",
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        )}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className={cn(
          "text-lg font-semibold mb-2",
          theme === "dark" ? "text-white" : "text-gray-900"
        )}>
          Repository Favorites
        </h3>
        <p className={cn(
          "text-sm",
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        )}>
          Mark repositories as favorites to make them appear first in the activity feed and other places. Drag to reorder.
        </p>
      </div>

      {/* Favorited repos */}
      {favorites.length > 0 && (
        <div className="space-y-2">
          <h4 className={cn(
            "text-sm font-medium",
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          )}>
            Favorited ({favorites.length})
          </h4>
          <div className="space-y-2">
            {favorites.map((fav) => (
              <div
                key={fav.repoKey}
                draggable
                onDragStart={() => handleDragStart(fav.repoKey)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(fav.repoKey)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded border cursor-move transition-colors",
                  draggedItem === fav.repoKey
                    ? theme === "dark"
                      ? "bg-gray-700 border-gray-600 opacity-50"
                      : "bg-gray-100 border-gray-300 opacity-50"
                    : theme === "dark"
                      ? "bg-gray-700/50 border-gray-600 hover:bg-gray-700"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                )}
              >
                <GripVertical size={16} className={cn(
                  theme === "dark" ? "text-gray-500" : "text-gray-400"
                )} />
                <div className="flex-1">
                  <span className={cn(
                    "text-sm font-medium",
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  )}>
                    {fav.repoKey.split('/').join(' / ')}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleFavorite(fav.repoKey)}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    theme === "dark"
                      ? "hover:bg-gray-600 text-yellow-400"
                      : "hover:bg-gray-200 text-yellow-500"
                  )}
                >
                  <Star size={18} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All repos */}
      <div>
        <h4 className={cn(
          "text-sm font-medium mb-2",
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        )}>
          All Repositories ({repositories.length})
        </h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {repositories.map((repo) => {
            const repoKey = `${repo.owner}/${repo.name}`;
            const favorited = isFavorited(repoKey);

            // Skip if already in favorited list
            if (favorited) return null;

            return (
              <div
                key={repoKey}
                className={cn(
                  "flex items-center gap-3 p-3 rounded border transition-colors",
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700 hover:bg-gray-700/50"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                )}
              >
                <div className="flex-1">
                  <span className={cn(
                    "text-sm",
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  )}>
                    <span className={cn(
                      "text-xs opacity-75",
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    )}>
                      {repo.owner}/
                    </span>
                    {repo.name}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleFavorite(repoKey)}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    theme === "dark"
                      ? "hover:bg-gray-600 text-gray-400 hover:text-yellow-400"
                      : "hover:bg-gray-200 text-gray-400 hover:text-yellow-500"
                  )}
                >
                  <Star size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
