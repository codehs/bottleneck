import { useState, useRef, useEffect } from "react";
import { Check, X, MessageSquare, Clock, MoreVertical, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../../utils/cn";
import { Markdown } from "../Markdown";
import { Review } from "../../services/github";

interface TimelineItemProps {
  item: any; // Using any here to match the original timeline item structure
  theme: "light" | "dark";
  currentUser?: { login: string } | null;
  onDeleteComment?: (commentId: number) => void;
}

export function TimelineItem({ item, theme, currentUser, onDeleteComment }: TimelineItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const getReviewIcon = (state: string) => {
    switch (state) {
      case "APPROVED":
        return <Check className="w-4 h-4 text-green-400" />;
      case "CHANGES_REQUESTED":
        return <X className="w-4 h-4 text-red-400" />;
      case "COMMENTED":
        return <MessageSquare className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  // Skip rendering items that are reviews without body and not meaningful state changes
  const isReview = item.type === "review";
  const review = item as Review;
  const hasContent = item.body && item.body.trim();
  const isMeaningfulReview =
    isReview &&
    (review.state === "APPROVED" ||
      review.state === "CHANGES_REQUESTED" ||
      (review.state === "COMMENTED" && hasContent));

  // Skip empty reviews that aren't approvals or change requests
  if (isReview && !isMeaningfulReview) {
    return null;
  }

  // Also skip non-review items without content
  if (!isReview && !hasContent) {
    return null;
  }

  const isAuthor = currentUser?.login === item.user.login;
  const canDelete = item.type === "comment" && isAuthor && onDeleteComment;

  return (
    <div className="card p-4">
      <div className="flex items-start space-x-3">
        <img
          src={item.user.avatar_url}
          alt={item.user.login}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {item.type === "review" && getReviewIcon((item as Review).state)}
              <span className="font-semibold">{item.user.login}</span>
              {item.type === "review" && (
                <span className="text-sm">
                  {(item as Review).state === "APPROVED" &&
                    "approved these changes"}
                  {(item as Review).state === "CHANGES_REQUESTED" &&
                    "requested changes"}
                  {(item as Review).state === "COMMENTED" && "reviewed"}
                </span>
              )}
              <span
                className={cn(
                  "text-sm",
                  theme === "dark" ? "text-gray-500" : "text-gray-600",
                )}
              >
                {formatDistanceToNow(new Date(item.timestamp), {
                  addSuffix: true,
                })}
              </span>
            </div>
            {canDelete && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={cn(
                    "p-1 rounded transition-colors",
                    theme === "dark"
                      ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-800",
                  )}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <div
                    className={cn(
                      "absolute right-0 mt-1 py-1 rounded shadow-lg z-10 min-w-[120px]",
                      theme === "dark"
                        ? "bg-gray-700 border border-gray-600"
                        : "bg-white border border-gray-200",
                    )}
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDeleteComment(item.id);
                      }}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-1.5 w-full text-left text-sm transition-colors",
                        "text-red-500 hover:bg-red-500 hover:text-white",
                      )}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {item.body && item.body.trim() && (
            <div
              className={cn(
                "overflow-hidden",
                theme === "dark" ? "text-gray-300" : "text-gray-700",
              )}
            >
              <Markdown content={item.body} variant="full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
