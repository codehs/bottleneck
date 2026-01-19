import { create } from "zustand";
import { PullRequest } from "../services/github";

export interface PersonStats {
  name: string;
  login: string;
  avatarUrl?: string;
  totalPRs: number;
  open: number;
  draft: number;
  merged: number;
  closed: number;
}

export interface CurrentSnapshot {
  totalOpen: number;
  totalDraft: number;
  reviewedByPerson: Map<string, { name: string; avatarUrl?: string; reviewCount: number }>;
}

export interface ActivityPeriod {
  label: string;
  days: number;
  merged: Map<string, { name: string; avatarUrl?: string; count: number }>;
  reviewed: Map<string, { name: string; avatarUrl?: string; count: number }>;
}

interface StatsState {
  currentSnapshot: CurrentSnapshot | null;
  activity: ActivityPeriod[];
  loading: boolean;

  // Actions
  calculateStats: (pullRequests: Map<string, PullRequest>) => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  currentSnapshot: null,
  activity: [],
  loading: false,

  calculateStats: (pullRequests: Map<string, PullRequest>) => {
    set({ loading: true });

    const now = new Date();
    const snapshot = calculateCurrentSnapshot(pullRequests);
    const activity = calculateActivity(pullRequests, now);

    set({
      currentSnapshot: snapshot,
      activity,
      loading: false,
    });
  },
}));

function calculateCurrentSnapshot(pullRequests: Map<string, PullRequest>): CurrentSnapshot {
  let totalOpen = 0;
  let totalDraft = 0;
  const reviewedByPerson = new Map<string, { name: string; avatarUrl?: string; reviewCount: number }>();

  pullRequests.forEach((pr) => {
    // Count current open and draft PRs
    if (pr.state === 'open') {
      if (pr.draft) {
        totalDraft++;
      } else {
        totalOpen++;
      }
    }

    // Count reviewers who have reviewed this PR (approved or changes requested)
    if (pr.approvedBy) {
      pr.approvedBy.forEach((reviewer) => {
        const key = reviewer.login;
        if (!reviewedByPerson.has(key)) {
          reviewedByPerson.set(key, {
            name: reviewer.login,
            avatarUrl: reviewer.avatar_url,
            reviewCount: 0,
          });
        }
        reviewedByPerson.get(key)!.reviewCount++;
      });
    }

    if (pr.changesRequestedBy) {
      pr.changesRequestedBy.forEach((reviewer) => {
        const key = reviewer.login;
        if (!reviewedByPerson.has(key)) {
          reviewedByPerson.set(key, {
            name: reviewer.login,
            avatarUrl: reviewer.avatar_url,
            reviewCount: 0,
          });
        }
        reviewedByPerson.get(key)!.reviewCount++;
      });
    }
  });

  return {
    totalOpen,
    totalDraft,
    reviewedByPerson,
  };
}

function calculateActivity(pullRequests: Map<string, PullRequest>, now: Date): ActivityPeriod[] {
  const periods: ActivityPeriod[] = [
    { label: '1 day', days: 1, merged: new Map(), reviewed: new Map() },
    { label: '7 days', days: 7, merged: new Map(), reviewed: new Map() },
    { label: '30 days', days: 30, merged: new Map(), reviewed: new Map() },
  ];

  pullRequests.forEach((pr) => {
    periods.forEach((period) => {
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - period.days);

      // Check if PR was merged in this period
      if (pr.merged_at) {
        const mergedDate = new Date(pr.merged_at);
        if (mergedDate >= cutoffDate && mergedDate <= now) {
          const authorKey = pr.user.login;
          if (!period.merged.has(authorKey)) {
            period.merged.set(authorKey, {
              name: pr.user.login,
              avatarUrl: pr.user.avatar_url,
              count: 0,
            });
          }
          period.merged.get(authorKey)!.count++;
        }
      }

      // Check if PR was reviewed in this period (approved or changes requested)
      if (pr.approvedBy) {
        pr.approvedBy.forEach((reviewer) => {
          // For simplicity, use the PR's updated_at as the review timestamp
          // In a real app, you'd have individual review timestamps
          const reviewDate = new Date(pr.updated_at);
          if (reviewDate >= cutoffDate && reviewDate <= now) {
            const reviewerKey = reviewer.login;
            if (!period.reviewed.has(reviewerKey)) {
              period.reviewed.set(reviewerKey, {
                name: reviewer.login,
                avatarUrl: reviewer.avatar_url,
                count: 0,
              });
            }
            period.reviewed.get(reviewerKey)!.count++;
          }
        });
      }

      if (pr.changesRequestedBy) {
        pr.changesRequestedBy.forEach((reviewer) => {
          const reviewDate = new Date(pr.updated_at);
          if (reviewDate >= cutoffDate && reviewDate <= now) {
            const reviewerKey = reviewer.login;
            if (!period.reviewed.has(reviewerKey)) {
              period.reviewed.set(reviewerKey, {
                name: reviewer.login,
                avatarUrl: reviewer.avatar_url,
                count: 0,
              });
            }
            period.reviewed.get(reviewerKey)!.count++;
          }
        });
      }
    });
  });

  return periods;
}
