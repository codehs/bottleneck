import { create } from "zustand";

export interface RepoFavorite {
  repoKey: string; // Format: "owner/repo"
  sortOrder: number;
  addedAt: string;
}

interface RepoFavoritesState {
  favorites: RepoFavorite[];
  loading: boolean;

  // Actions
  loadFavorites: () => Promise<void>;
  addFavorite: (repoKey: string) => void;
  removeFavorite: (repoKey: string) => void;
  reorderFavorites: (favorites: RepoFavorite[]) => void;
  isFavorited: (repoKey: string) => boolean;
  getSortedFavorites: () => RepoFavorite[];
}

// Load favorites from electron store
const loadFavoritesFromStore = async (): Promise<RepoFavorite[]> => {
  if (window.electron) {
    try {
      const result = await window.electron.settings.get("repoFavorites");
      if (result.success && result.value) {
        return result.value as RepoFavorite[];
      }
    } catch (error) {
      console.error("Failed to load repo favorites:", error);
    }
  }
  return [];
};

// Save favorites to electron store
const saveFavoritesToStore = async (favorites: RepoFavorite[]) => {
  if (window.electron) {
    try {
      await window.electron.settings.set("repoFavorites", favorites);
    } catch (error) {
      console.error("Failed to save repo favorites:", error);
    }
  }
};

export const useRepoFavoritesStore = create<RepoFavoritesState>((set, get) => ({
  favorites: [],
  loading: true,

  loadFavorites: async () => {
    const favorites = await loadFavoritesFromStore();
    set({ favorites, loading: false });
  },

  addFavorite: (repoKey: string) => {
    const state = get();
    
    // Check if already favorited
    if (state.favorites.some((f) => f.repoKey === repoKey)) {
      return;
    }

    const newFavorites = [
      ...state.favorites,
      {
        repoKey,
        sortOrder: state.favorites.length,
        addedAt: new Date().toISOString(),
      },
    ];

    set({ favorites: newFavorites });
    saveFavoritesToStore(newFavorites);
  },

  removeFavorite: (repoKey: string) => {
    const state = get();
    const newFavorites = state.favorites
      .filter((f) => f.repoKey !== repoKey)
      .map((f, idx) => ({ ...f, sortOrder: idx }));

    set({ favorites: newFavorites });
    saveFavoritesToStore(newFavorites);
  },

  reorderFavorites: (favorites: RepoFavorite[]) => {
    const updated = favorites.map((f, idx) => ({
      ...f,
      sortOrder: idx,
    }));
    
    set({ favorites: updated });
    saveFavoritesToStore(updated);
  },

  isFavorited: (repoKey: string) => {
    return get().favorites.some((f) => f.repoKey === repoKey);
  },

  getSortedFavorites: () => {
    return [...get().favorites].sort((a, b) => a.sortOrder - b.sortOrder);
  },
}));
