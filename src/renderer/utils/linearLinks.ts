/**
 * Utilities for extracting Linear issue identifiers from text (PR descriptions, etc.)
 */

import { PullRequest } from "../services/github";

/**
 * Linear issue info extracted from PR body (for PRTreeView display)
 */
export interface LinearIssue {
  id: string;       // e.g., "ABC-123"
  url: string;      // Full Linear URL
  team?: string;    // Team slug from URL if available
}

/**
 * Extract Linear issue references from PR body (legacy function for PRTreeView)
 * Supports:
 * - Full URLs: https://linear.app/team/issue/ABC-123/optional-title
 * - Short URLs: linear.app/team/issue/ABC-123
 */
export function extractLinearIssues(prBody: string | null): LinearIssue[] {
  if (!prBody) return [];

  const issues: LinearIssue[] = [];
  const seenIds = new Set<string>();

  // Match Linear URLs: https://linear.app/team-slug/issue/ABC-123/optional-title
  // The issue ID is the uppercase team prefix + number (e.g., ABC-123)
  const linearUrlPattern = /https?:\/\/linear\.app\/([a-zA-Z0-9-]+)\/issue\/([A-Z]+-\d+)(?:\/[^\s)>\]]*)?/gi;

  let match;
  while ((match = linearUrlPattern.exec(prBody)) !== null) {
    const team = match[1];
    const issueId = match[2];

    if (!seenIds.has(issueId)) {
      seenIds.add(issueId);
      issues.push({
        id: issueId,
        url: `https://linear.app/${team}/issue/${issueId}`,
        team,
      });
    }
  }

  return issues;
}

/**
 * Regex patterns to match Linear issue identifiers
 *
 * Matches:
 * - ENG-123 (team prefix + number)
 * - linear.app/team/issue/ENG-123
 * - linear.app/company/issue/ENG-123/description
 * - https://linear.app/...
 *
 * Team prefixes are typically 2-10 uppercase letters
 */
const LINEAR_ID_PATTERNS = [
  // Full Linear URLs: https://linear.app/company/issue/ENG-123 or /ENG-123/slug
  /https?:\/\/linear\.app\/[\w-]+\/issue\/([A-Z]{2,10}-\d+)/gi,
  // Standalone identifiers: ENG-123 (must be word-bounded)
  /\b([A-Z]{2,10}-\d+)\b/g,
];

/**
 * Extract all Linear issue identifiers from a text string
 * Returns deduplicated list of identifiers (e.g., ["ENG-123", "TEAM-456"])
 */
export function extractLinearIssueIds(text: string | null | undefined): string[] {
  if (!text) return [];

  const ids = new Set<string>();

  for (const pattern of LINEAR_ID_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(text)) !== null) {
      // match[1] is the captured group (the identifier)
      // For the standalone pattern, match[0] === match[1]
      const id = match[1] || match[0];
      ids.add(id.toUpperCase());
    }
  }

  return Array.from(ids);
}

/**
 * Extract Linear issue IDs from a pull request's body/description
 */
export function extractLinearIdsFromPR(pr: PullRequest): string[] {
  const allText = [pr.body, pr.title].filter(Boolean).join("\n");
  return extractLinearIssueIds(allText);
}

/**
 * Build a map of Linear issue ID -> PRs that reference it
 * This scans all PRs and groups them by their linked Linear issues
 */
export function buildLinearIssueToPRMap(
  pullRequests: Map<string, PullRequest>,
  repoOwner: string,
  repoName: string
): Map<string, PullRequest[]> {
  const map = new Map<string, PullRequest[]>();

  for (const pr of pullRequests.values()) {
    // Filter to PRs from the current repo
    const prRepoOwner = pr.base?.repo?.owner?.login;
    const prRepoName = pr.base?.repo?.name;
    if (prRepoOwner !== repoOwner || prRepoName !== repoName) {
      continue;
    }

    const linearIds = extractLinearIdsFromPR(pr);
    for (const id of linearIds) {
      const existing = map.get(id) || [];
      existing.push(pr);
      map.set(id, existing);
    }
  }

  return map;
}

/**
 * Get all unique Linear issue IDs referenced by PRs in a repo
 */
export function getAllLinearIdsFromPRs(
  pullRequests: Map<string, PullRequest>,
  repoOwner: string,
  repoName: string
): string[] {
  const ids = new Set<string>();

  for (const pr of pullRequests.values()) {
    // Filter to PRs from the current repo
    const prRepoOwner = pr.base?.repo?.owner?.login;
    const prRepoName = pr.base?.repo?.name;
    if (prRepoOwner !== repoOwner || prRepoName !== repoName) {
      continue;
    }

    const linearIds = extractLinearIdsFromPR(pr);
    for (const id of linearIds) {
      ids.add(id);
    }
  }

  return Array.from(ids);
}
