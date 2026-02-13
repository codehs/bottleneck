import { create } from "zustand";
import { GitHubAPI, ReviewThread, Comment } from "../services/github";
import { isAgentUser, parseAgentPrompt } from "../components/AgentPromptBlock";
import { useAuthStore } from "./authStore";
import { usePRStore } from "./prStore";

export interface DevinComment {
  id: string;
  threadId: string;
  comment: Comment;
  thread: ReviewThread;
  pr: {
    owner: string;
    repo: string;
    number: number;
    title: string;
    author: string;
    authorAvatar: string;
  };
  parsedPrompt: string | null;
  createdAt: Date;
}

interface DevinCacheData {
  comments: any[];
  lastFetched: number;
}

// Load cached Devin comments from electron store
const loadDevinCache = async (): Promise<{ comments: DevinComment[]; lastFetched: number | null }> => {
  if (window.electron) {
    try {
      const result = await window.electron.settings.get("devinCache");
      if (result.success && result.value) {
        const cached = result.value as DevinCacheData;
        const comments = cached.comments.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        }));
        return { comments, lastFetched: cached.lastFetched };
      }
    } catch (error) {
      console.error("Failed to load Devin cache:", error);
    }
  }
  return { comments: [], lastFetched: null };
};

// Save Devin comments to electron store (debounced)
let devinCacheSaveTimer: NodeJS.Timeout | null = null;
const saveDevinCache = (comments: DevinComment[], lastFetched: number) => {
  if (devinCacheSaveTimer) {
    clearTimeout(devinCacheSaveTimer);
  }

  devinCacheSaveTimer = setTimeout(async () => {
    if (window.electron) {
      try {
        const cacheData: DevinCacheData = {
          comments: comments.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
          })),
          lastFetched,
        };
        await window.electron.settings.set("devinCache", cacheData);
        console.log(`[DevinStore] Saved ${comments.length} comments to cache`);
      } catch (error) {
        console.error("Failed to save Devin cache:", error);
      }
    }
  }, 2000);
};

interface DevinState {
  comments: DevinComment[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheLoaded: boolean;

  fetchDevinComments: () => Promise<void>;
  clearComments: () => void;
}

export const useDevinStore = create<DevinState>((set, get) => {
  // Hydrate from cache on store creation
  loadDevinCache().then(({ comments, lastFetched }) => {
    if (comments.length > 0) {
      set({ comments, lastFetched, cacheLoaded: true });
    } else {
      set({ cacheLoaded: true });
    }
  });

  return {
    comments: [],
    loading: false,
    error: null,
    lastFetched: null,
    cacheLoaded: false,

    fetchDevinComments: async () => {
      const { loading } = get();
      if (loading) return;

      set({ loading: true, error: null });

      try {
        let token: string | null = null;

        if (window.electron) {
          token = await window.electron.auth.getToken();
        } else {
          token = useAuthStore.getState().token;
        }

        if (!token) {
          throw new Error("Not authenticated");
        }

        if (token === "dev-token") {
          // Mock data for dev mode
          set({ comments: [], loading: false, lastFetched: Date.now() });
          return;
        }

        const api = new GitHubAPI(token);

        // Get recently viewed repos from prStore
        const recentRepos = usePRStore.getState().recentlyViewedRepos || [];

        if (recentRepos.length === 0) {
          const now = Date.now();
          set({ comments: [], loading: false, lastFetched: now });
          saveDevinCache([], now);
          return;
        }

        const allDevinComments: DevinComment[] = [];

        // Fetch from up to 5 most recent repos
        const reposToFetch = recentRepos.slice(0, 5);

        for (const repo of reposToFetch) {
          try {
            // Get open PRs for this repo
            const openPRs = await api.getOpenAndDraftPullRequests(repo.owner, repo.name);

            // For each open PR, fetch review threads
            for (const pr of openPRs) {
              try {
                const threads = await api.getPullRequestReviewThreads(
                  repo.owner,
                  repo.name,
                  pr.number
                );

                // Filter for unresolved threads with Devin comments
                for (const thread of threads) {
                  if (thread.state === "resolved") continue;

                  // Check if the first comment is from Devin
                  const firstComment = thread.comments[0];
                  if (!firstComment || !isAgentUser(firstComment.user.login)) continue;

                  // Parse the prompt from the comment
                  const { prompt } = parseAgentPrompt(firstComment.body);

                  allDevinComments.push({
                    id: `${repo.owner}/${repo.name}#${pr.number}-${thread.id}`,
                    threadId: thread.id,
                    comment: firstComment,
                    thread,
                    pr: {
                      owner: repo.owner,
                      repo: repo.name,
                      number: pr.number,
                      title: pr.title,
                      author: pr.user.login,
                      authorAvatar: pr.user.avatar_url,
                    },
                    parsedPrompt: prompt,
                    createdAt: new Date(firstComment.created_at),
                  });
                }
              } catch (err) {
                console.warn(`Failed to fetch threads for PR #${pr.number}:`, err);
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch PRs for ${repo.owner}/${repo.name}:`, err);
          }
        }

        // Sort by created date, newest first
        allDevinComments.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );

        const now = Date.now();
        set({
          comments: allDevinComments,
          loading: false,
          lastFetched: now,
        });

        // Persist to cache
        saveDevinCache(allDevinComments, now);
      } catch (error) {
        console.error("Failed to fetch Devin comments:", error);
        set({
          error: (error as Error).message,
          loading: false,
        });
      }
    },

    clearComments: () => {
      set({ comments: [], lastFetched: null, error: null });
      if (window.electron) {
        window.electron.settings.set("devinCache", null);
      }
    },
  };
});
