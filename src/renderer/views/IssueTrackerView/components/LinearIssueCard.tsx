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
  theme: "light" | "dark";
}

/**
 * Get a status icon/color based on Linear state type
 */
function getStateStyle(stateType: string, theme: "light" | "dark") {
  switch (stateType) {
    case "backlog":
    case "triage":
      return {
        bgColor: theme === "dark" ? "bg-gray-700" : "bg-gray-200",
        textColor: theme === "dark" ? "text-gray-300" : "text-gray-600",
      };
    case "unstarted":
      return {
        bgColor: theme === "dark" ? "bg-blue-900/50" : "bg-blue-100",
        textColor: theme === "dark" ? "text-blue-300" : "text-blue-700",
      };
    case "started":
      return {
        bgColor: theme === "dark" ? "bg-yellow-900/50" : "bg-yellow-100",
        textColor: theme === "dark" ? "text-yellow-300" : "text-yellow-700",
      };
    case "completed":
      return {
        bgColor: theme === "dark" ? "bg-green-900/50" : "bg-green-100",
        textColor: theme === "dark" ? "text-green-300" : "text-green-700",
      };
    case "canceled":
      return {
        bgColor: theme === "dark" ? "bg-red-900/50" : "bg-red-100",
        textColor: theme === "dark" ? "text-red-300" : "text-red-700",
      };
    default:
      return {
        bgColor: theme === "dark" ? "bg-gray-700" : "bg-gray-200",
        textColor: theme === "dark" ? "text-gray-300" : "text-gray-600",
      };
  }
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
  theme,
}: LinearIssueCardProps) {
  const stateStyle = getStateStyle(issue.state.type, theme);
  const priorityInfo = getPriorityInfo(issue.priority, theme);

  const handleClick = () => {
    onIssueClick(issue);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "p-2 rounded border cursor-pointer transition-all duration-200 group relative",
        theme === "dark"
          ? "bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600"
          : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300",
        "hover:shadow-sm",
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

      {/* Status badge */}
      <div className="flex flex-wrap gap-1 mb-1.5">
        <span
          className={cn(
            "px-1.5 py-0.5 rounded text-xs font-medium",
            stateStyle.bgColor,
            stateStyle.textColor,
          )}
          style={{ fontSize: "0.625rem" }}
        >
          {issue.state.name}
        </span>
        {issue.project && (
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
        )}
      </div>

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
                className={cn(
                  "flex items-center text-xs gap-1",
                  theme === "dark" ? "text-gray-400" : "text-gray-600",
                )}
                style={{ fontSize: "0.625rem" }}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
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
