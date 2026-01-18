import { create } from "zustand";
import { usePRStore } from "./prStore";

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncProgress: number;
  syncMessage: string;
  syncErrors: string[];
  syncDebounceTimer: NodeJS.Timeout | null;

  syncAll: () => Promise<void>;
  syncRepository: (owner: string, repo: string) => Promise<void>;
  syncPullRequest: (
    owner: string,
    repo: string,
    number: number,
  ) => Promise<void>;
  setSyncProgress: (progress: number, message?: string) => void;
  addSyncError: (error: string) => void;
  clearSyncErrors: () => void;
}

// Initialize lastSyncTime from localStorage
const getInitialSyncTime = (): Date | null => {
  const stored = localStorage.getItem("lastSyncTime");
  if (stored) {
    try {
      return new Date(stored);
    } catch {
      return null;
    }
  }
  return null;
};

export const useSyncStore = create<SyncState>((set, get) => ({
  isSyncing: false,
  lastSyncTime: getInitialSyncTime(),
  syncProgress: 0,
  syncMessage: "",
  syncErrors: [],
  syncDebounceTimer: null as NodeJS.Timeout | null,

  syncAll: async () => {
  const state = get();

  // Debounce: if already syncing or a sync was just triggered, ignore
  if (state.isSyncing) {
    console.log("Sync already in progress, skipping...");
    return;
  }

  // Clear any existing debounce timer
  if (state.syncDebounceTimer) {
    clearTimeout(state.syncDebounceTimer);
  }

  // Set a debounce timer to prevent rapid clicks
  const timer = setTimeout(() => {
    set({ syncDebounceTimer: null });
  }, 1000);

  set({
    isSyncing: true,
    syncProgress: 0,
    syncMessage: "Starting sync...",
    syncErrors: [],
    syncDebounceTimer: timer,
  });

  try {
    // Get all repositories
    const prStore = usePRStore.getState();

    // Sync repositories first
    set({ syncMessage: "Fetching repositories..." });
    await prStore.fetchRepositories();
    set({ syncProgress: 20 });

    // Sync all recently viewed repos + selected repo in parallel
    const selectedRepo = prStore.selectedRepo;
    const recentRepos = prStore.recentlyViewedRepos;
    
    // Combine selected repo + recent repos, remove duplicates
    const reposToSync = selectedRepo
      ? [selectedRepo, ...recentRepos.filter((r) => r.id !== selectedRepo.id)]
      : recentRepos;

    const totalRepos = reposToSync.length;

    if (totalRepos === 0) {
      set({
        syncProgress: 100,
        syncMessage: "No repositories to sync",
      });
    } else {
      // Sync all repos in parallel for speed
      const syncPromises = reposToSync.map((repo, index) => {
        const shouldReplaceStore = selectedRepo
          ? repo.id === selectedRepo.id
          : index === 0;

        return prStore.fetchPullRequests(repo.owner, repo.name, true, {
          replaceStore: shouldReplaceStore,
        }).catch((error) => {
          get().addSyncError(
            `Failed to sync ${repo.full_name}: ${(error as Error).message}`,
          );
        });
      });

      // Update progress as repos complete
      let completed = 0;
      const updateProgress = () => {
        completed++;
        const progress = 20 + 80 * (completed / totalRepos);
        set({
          syncProgress: Math.min(progress, 99), // Keep at 99 until all done
          syncMessage: `Syncing ${completed}/${totalRepos} repos...`,
        });
      };

      // Execute with progress updates
      for (const promise of syncPromises) {
        await promise;
        updateProgress();
      }
    }

    const syncTime = new Date();
    set({
      isSyncing: false,
      lastSyncTime: syncTime,
      syncProgress: 100,
      syncMessage: "Sync complete!",
      syncErrors: [], // Clear errors on successful sync
    });

    // Save sync time to localStorage for persistence
    localStorage.setItem("lastSyncTime", syncTime.toISOString());

    // Clear message after a delay
    setTimeout(() => {
      set({ syncMessage: "", syncProgress: 0 });
    }, 3000);
  } catch (error) {
    set({
      isSyncing: false,
      syncMessage: "Sync failed",
      syncProgress: 0,
    });
    get().addSyncError((error as Error).message);
  }
  },

  syncRepository: async (owner: string, repo: string) => {
    const state = get();

    // Debounce check
    if (state.isSyncing) {
      console.log("Sync already in progress, skipping repository sync...");
      return;
    }

    set({
      isSyncing: true,
      syncMessage: `Syncing ${owner}/${repo}...`,
    });

    try {
      const prStore = usePRStore.getState();
      await prStore.fetchPullRequests(owner, repo, true); // Force refresh

      const syncTime = new Date();
      set({
        isSyncing: false,
        lastSyncTime: syncTime,
        syncMessage: "Repository synced!",
        syncErrors: [], // Clear errors on successful sync
      });

      // Save sync time to localStorage
      localStorage.setItem("lastSyncTime", syncTime.toISOString());

      setTimeout(() => {
        set({ syncMessage: "" });
      }, 3000);
    } catch (error) {
      set({
        isSyncing: false,
        syncMessage: "Sync failed",
      });
      get().addSyncError((error as Error).message);
    }
  },

  syncPullRequest: async (owner: string, repo: string, number: number) => {
    set({
      isSyncing: true,
      syncMessage: `Syncing PR #${number}...`,
    });

    try {
      let token: string | null = null;

      // Check if we're using electron or dev mode
      if (window.electron) {
        token = await window.electron.auth.getToken();
      } else {
        // In dev mode, get token from auth store
        const { useAuthStore } = await import("./authStore");
        const authStore = useAuthStore.getState();
        token = authStore.token;
      }

      if (!token) throw new Error("Not authenticated");

      // For dev mode, just find and return the mock PR
      if (token === "dev-token") {
        const { mockPullRequests } = await import("../mockData");
        const pr = mockPullRequests.find((p) => p.number === number);
        if (pr) {
          // Update in store
          const prStore = usePRStore.getState();
          prStore.updatePR(pr);
        }
      } else {
        const { GitHubAPI } = await import("../services/github");
        const api = new GitHubAPI(token);

        // Fetch PR details
        const pr = await api.getPullRequest(owner, repo, number);

        // Update in store
        const prStore = usePRStore.getState();
        prStore.updatePR(pr);
      }

      set({
        isSyncing: false,
        lastSyncTime: new Date(),
        syncMessage: "PR synced!",
      });

      setTimeout(() => {
        set({ syncMessage: "" });
      }, 3000);
    } catch (error) {
      set({
        isSyncing: false,
        syncMessage: "Sync failed",
      });
      get().addSyncError((error as Error).message);
    }
  },

  setSyncProgress: (progress, message) => {
    set({
      syncProgress: progress,
      syncMessage: message || get().syncMessage,
    });
  },

  addSyncError: (error) => {
    set((state) => ({
      syncErrors: [...state.syncErrors, error],
    }));
  },

  clearSyncErrors: () => {
    set({ syncErrors: [] });
  },
}));
