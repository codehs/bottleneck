import React from "react";
import {
  ExternalLink,
  User,
  FolderKanban,
} from "lucide-react";
import { LinearIssue } from "../../../services/linear";
import { cn } from "../../../utils/cn";
import { formatDistanceToNow } from "date-fns";

export interface LinearIssueCardProps {
  issue: LinearIssue;
  onIssueClick: (issue: LinearIssue) => void;
  onPRClick: (prNumber: number) => void;
  theme: "light" | "dark";
}

/**
 * Get priority label and color
 */
function getPriorityInfo(priority: number, theme: "light" | "dark") {
  switch (priority) {
    case 1:
      return {
        label: "Urgent",
        color: theme === "dark" ? "text-red-400" : "text-red-600",
      };
    case 2:
      return {
        label: "High",
        color: theme === "dark" ? "text-orange-400" : "text-orange-600",
      };
    case 3:
      return {
        label: "Medium",
        color: theme === "dark" ? "text-yellow-400" : "text-yellow-600",
      };
    case 4:
      return {
        label: "Low",
        color: theme === "dark" ? "text-gray-400" : "text-gray-500",
      };
    default:
      return null;
  }
}

export const LinearIssueCard = React.memo(function LinearIssueCard({
  issue,
  onIssueClick,
  onPRClick,
  theme,
}: LinearIssueCardProps) {
  const priorityInfo = getPriorityInfo(issue.priority, theme);

  const handleIssueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIssueClick(issue);
  };

  const handlePRClick = (e: React.MouseEvent, prNumber: number) => {
    e.stopPropagation();
    onPRClick(prNumber);
  };

  return (
    <div
      className={cn(
        "p-2 rounded border transition-all duration-200 group relative",
        theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200",
      )}
    >
      {/* Clickable issue area */}
      <div
        onClick={handleIssueClick}
        className={cn(
          "cursor-pointer rounded -m-1 p-1 transition-colors",
          theme === "dark"
            ? "hover:bg-gray-700/50"
            : "hover:bg-gray-100",
        )}
      >
        {/* Header: Identifier + External link */}
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex items-center space-x-1.5 flex-1 min-w-0">
            <span
              className={cn(
                "text-xs font-mono font-medium",
                theme === "dark" ? "text-blue-400" : "text-blue-600",
              )}
            >
              {issue.identifier}
            </span>
            {priorityInfo && (
              <span
                className={cn("text-xs font-medium", priorityInfo.color)}
                style={{ fontSize: "0.625rem" }}
              >
                {priorityInfo.label}
              </span>
            )}
          </div>
          <ExternalLink
            className={cn(
              "w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity",
              theme === "dark" ? "text-gray-500" : "text-gray-400",
            )}
          />
        </div>

        {/* Title */}
        <h3
          className={cn(
            "text-xs font-medium mb-1.5 leading-tight",
            theme === "dark" ? "text-white" : "text-gray-900",
          )}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {issue.title}
        </h3>

        {/* Project badge */}
        {issue.project && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-0.5",
                theme === "dark"
                  ? "bg-purple-900/50 text-purple-300"
                  : "bg-purple-100 text-purple-700",
              )}
              style={{ fontSize: "0.625rem" }}
            >
              <FolderKanban className="w-2.5 h-2.5" />
              {issue.project.name}
            </span>
          </div>
        )}

        {/* Assignee + Updated time */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            {issue.assignee ? (
              <>
                {issue.assignee.avatarUrl ? (
                  <img
                    src={issue.assignee.avatarUrl}
                    alt={issue.assignee.displayName}
                    className="w-3.5 h-3.5 rounded-full"
                  />
                ) : (
                  <User className="w-3 h-3 text-gray-400" />
                )}
                <span
                  className={cn(
                    "text-xs",
                    theme === "dark" ? "text-gray-400" : "text-gray-600",
                  )}
                  style={{ fontSize: "0.625rem" }}
                >
                  {issue.assignee.displayName}
                </span>
              </>
            ) : (
              <span
                className={cn(
                  "text-xs italic",
                  theme === "dark" ? "text-gray-500" : "text-gray-400",
                )}
                style={{ fontSize: "0.625rem" }}
              >
                Unassigned
              </span>
            )}
          </div>
          <span
            className={cn(theme === "dark" ? "text-gray-500" : "text-gray-500")}
            style={{ fontSize: "0.625rem" }}
          >
            {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Linked PRs */}
      {issue.linkedPRs && issue.linkedPRs.length > 0 && (
        <div
          className={cn(
            "mt-2 pt-2 border-t",
            theme === "dark" ? "border-gray-700" : "border-gray-200",
          )}
        >
          <div className="space-y-1">
            {issue.linkedPRs.slice(0, 3).map((pr) => (
              <div
                key={pr.number}
                onClick={(e) => handlePRClick(e, pr.number)}
                className={cn(
                  "flex items-center text-xs gap-1 cursor-pointer rounded px-1 -mx-1 py-0.5 transition-colors",
                  theme === "dark"
                    ? "text-gray-400 hover:bg-gray-700/50 hover:text-gray-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
                style={{ fontSize: "0.625rem" }}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                    pr.merged
                      ? "bg-purple-500"
                      : pr.state === "open"
                        ? pr.draft
                          ? "bg-gray-500"
                          : "bg-green-500"
                        : "bg-red-500",
                  )}
                />
                <span className="font-mono">#{pr.number}</span>
                <span className="truncate flex-1">{pr.title}</span>
                {pr.draft && (
                  <span className="text-gray-500 italic">Draft</span>
                )}
                {pr.merged && (
                  <span className="text-purple-400">Merged</span>
                )}
              </div>
            ))}
            {issue.linkedPRs.length > 3 && (
              <div
                className={cn(
                  "text-xs",
                  theme === "dark" ? "text-gray-500" : "text-gray-400",
                )}
                style={{ fontSize: "0.625rem" }}
              >
                +{issue.linkedPRs.length - 3} more PRs
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
