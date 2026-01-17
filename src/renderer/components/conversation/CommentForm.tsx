import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { Send } from "lucide-react";
import { cn } from "../../utils/cn";
import { PullRequest, Comment, Review } from "../../services/github";

export type CommentSubmitResult = 
  | { type: "comment"; comment: Comment }
  | { type: "review"; review: Review };

interface CommentFormProps {
  pr: PullRequest;
  user: { avatar_url: string; login: string } | null;
  token: string | null;
  theme: "light" | "dark";
  onCommentSubmit: (result: CommentSubmitResult) => void;
}

export interface CommentFormRef {
  focus: () => void;
}

export const CommentForm = forwardRef<CommentFormRef, CommentFormProps>(function CommentForm({
  pr,
  user,
  token,
  theme,
  onCommentSubmit,
}, ref) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewType, setReviewType] = useState<
    "comment" | "approve" | "request_changes"
  >("comment");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
  }));

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !token || !user) return;

    const submittedText = commentText;
    setIsSubmitting(true);
    setCommentText("");

    // Create optimistic comment/review immediately
    const now = new Date().toISOString();
    if (reviewType === "comment") {
      const optimisticComment: Comment = {
        id: Date.now(), // Temporary ID
        body: submittedText,
        user: { login: user.login, avatar_url: user.avatar_url },
        created_at: now,
        updated_at: now,
        html_url: "",
      };
      onCommentSubmit({ type: "comment", comment: optimisticComment });
    } else {
      const optimisticReview: Review = {
        id: Date.now(),
        body: submittedText,
        state: reviewType === "approve" ? "APPROVED" : "CHANGES_REQUESTED",
        user: { login: user.login, avatar_url: user.avatar_url },
        submitted_at: now,
        commit_id: "",
      };
      onCommentSubmit({ type: "review", review: optimisticReview });
    }

    try {
      const { GitHubAPI } = await import("../../services/github");
      const api = new GitHubAPI(token);

      if (reviewType === "comment") {
        await api.createComment(
          pr.base.repo.owner.login,
          pr.base.repo.name,
          pr.number,
          submittedText,
        );
      } else {
        await api.createReview(
          pr.base.repo.owner.login,
          pr.base.repo.name,
          pr.number,
          submittedText,
          reviewType === "approve" ? "APPROVE" : "REQUEST_CHANGES",
        );
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
      // Restore text on error so user can retry
      setCommentText(submittedText);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pr.state !== "open") return null;

  return (
    <div className="card p-6 mt-6">
      <div className="flex items-start space-x-3">
        <img
          src={user?.avatar_url || ""}
          alt={user?.login || "You"}
          className="w-8 h-8 rounded-full"
        />
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey && commentText.trim() && !isSubmitting) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
            className="input w-full h-32 resize-none mb-3"
            placeholder="Leave a comment... (⌘↵ to submit)"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setReviewType("comment")}
                className={cn(
                  "px-3 py-1 rounded text-sm",
                  reviewType === "comment"
                    ? theme === "dark"
                      ? "bg-gray-700"
                      : "bg-gray-200"
                    : theme === "dark"
                      ? "hover:bg-gray-800"
                      : "hover:bg-gray-100",
                )}
              >
                Comment
              </button>
              <button
                onClick={() => setReviewType("approve")}
                className={cn(
                  "px-3 py-1 rounded text-sm",
                  reviewType === "approve"
                    ? theme === "dark"
                      ? "bg-green-900"
                      : "bg-green-100"
                    : theme === "dark"
                      ? "hover:bg-gray-800"
                      : "hover:bg-gray-100",
                )}
              >
                Approve
              </button>
              <button
                onClick={() => setReviewType("request_changes")}
                className={cn(
                  "px-3 py-1 rounded text-sm",
                  reviewType === "request_changes"
                    ? theme === "dark"
                      ? "bg-red-900"
                      : "bg-red-100"
                    : theme === "dark"
                      ? "hover:bg-gray-800"
                      : "hover:bg-gray-100",
                )}
              >
                Request changes
              </button>
            </div>

            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || isSubmitting}
              className="btn btn-primary text-sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
