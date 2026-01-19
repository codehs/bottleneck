import { create } from "zustand";
import { GitHubAPI } from "../services/github";
import { useAuthStore } from "./authStore";

interface Label {
  name: string;
  color: string;
  description?: string | null;
}

interface LabelState {
  labels: Map<string, Label[]>; // repo (owner/repo) -> labels mapping
  loading: Map<string, boolean>; // repo -> loading status
  lastFetched: Map<string, number>; // repo -> timestamp
  fetchLabels: (owner: string, repo: string, forceRefresh?: boolean) => Promise<Label[]>;
  getCachedLabels: (owner: string, repo: string) => Label[] | null;
}

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export const useLabelStore = create<LabelState>((set, get) => ({
  labels: new Map(),
  loading: new Map(),
  lastFetched: new Map(),

  fetchLabels: async (owner: string, repo: string, forceRefresh = false) => {
    const state = get();
    const repoKey = `${owner}/${repo}`;
    const cached = state.labels.get(repoKey);
    const lastFetch = state.lastFetched.get(repoKey) ?? 0;
    const now = Date.now();

    // Return cached labels if fresh and not force refreshing
    if (
      !forceRefresh &&
      cached &&
      cached.length > 0 &&
      now - lastFetch < CACHE_DURATION
    ) {
      return cached;
    }

    // Don't fetch if already loading
    if (state.loading.get(repoKey)) {
      return cached || [];
    }

    set((s) => {
      const loading = new Map(s.loading);
      loading.set(repoKey, true);
      return { loading };
    });

    try {
      const { token } = useAuthStore.getState();
      const api = new GitHubAPI(token);
      const labels = await api.getRepoLabels(owner, repo);

      set((s) => {
        const newLabels = new Map(s.labels);
        const newLastFetched = new Map(s.lastFetched);
        const newLoading = new Map(s.loading);

        newLabels.set(repoKey, labels);
        newLastFetched.set(repoKey, now);
        newLoading.set(repoKey, false);

        return {
          labels: newLabels,
          lastFetched: newLastFetched,
          loading: newLoading,
        };
      });

      return labels;
    } catch (error) {
      console.error(`Error fetching labels for ${repoKey}:`, error);

      set((s) => {
        const newLoading = new Map(s.loading);
        newLoading.set(repoKey, false);
        return { loading: newLoading };
      });

      return cached || [];
    }
  },

  getCachedLabels: (owner: string, repo: string) => {
    const state = get();
    const repoKey = `${owner}/${repo}`;
    const cached = state.labels.get(repoKey);
    const lastFetch = state.lastFetched.get(repoKey) ?? 0;
    const now = Date.now();

    // Return cached labels if fresh
    if (cached && cached.length > 0 && now - lastFetch < CACHE_DURATION) {
      return cached;
    }

    return null;
  },
}));
