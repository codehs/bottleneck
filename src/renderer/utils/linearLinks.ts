/**
 * Utility functions for extracting Linear issue references from PR descriptions
 */

export interface LinearIssue {
  id: string;       // e.g., "ABC-123"
  url: string;      // Full Linear URL
  team?: string;    // Team slug from URL if available
}

/**
 * Extract Linear issue references from PR body
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
