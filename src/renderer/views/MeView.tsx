import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { usePRStore } from "../stores/prStore";
import { useUIStore } from "../stores/uiStore";
import type { PullRequest } from "../services/github";
import { cn } from "../utils/cn";
import { getPRIconProps } from "../utils/prStatus";

const formatDateTime = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (diffDays === 0) {
    return `Today at ${timeStr}`;
  }

  if (diffDays === 1) {
    return `Yesterday at ${timeStr}`;
  }

  const dateStr = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });

  return `${dateStr} at ${timeStr}`;
};

const getPRKey = (pr: PullRequest) =>
  `${pr.base.repo.owner.login}/${pr.base.repo.name}#${pr.number}`;

const matchesLogin = (login: string | undefined, target: string) =>
  Boolean(login && login.toLowerCase() === target.toLowerCase());

const sortByUpdated = (a: PullRequest, b: PullRequest) =>
  new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();

interface PRSectionProps {
  title: string;
  description: string;
  prs: PullRequest[];
  theme: "light" | "dark";
  emptyMessage: string;
  onSelect: (pr: PullRequest) => void;
}

const PRSection = ({
  title,
  description,
  prs,
  theme,
  emptyMessage,
  onSelect,
}: PRSectionProps) => (
  <div
    className={cn(
      "rounded-xl border p-4 flex flex-col min-h-[280px]",
      theme === "dark"
        ? "bg-gray-800 border-gray-700"
        : "bg-white border-gray-200",
    )}
  >
    <div className="mb-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        {title}
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            theme === "dark"
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-100 text-gray-600",
          )}
        >
          {prs.length}
        </span>
      </h2>
      <p
        className={cn(
          "text-sm mt-1",
          theme === "dark" ? "text-gray-400" : "text-gray-500",
        )}
      >
        {description}
      </p>
    </div>

    {prs.length === 0 ? (
      <div
        className={cn(
          "flex-1 flex items-center justify-center text-sm",
          theme === "dark" ? "text-gray-500" : "text-gray-400",
        )}
      >
        {emptyMessage}
      </div>
    ) : (
      <ul className="space-y-3">
        {prs.map((pr) => {
          const { Icon, className: iconClassName } = getPRIconProps(pr, "w-4 h-4");
          const repoName = `${pr.base.repo.owner.login}/${pr.base.repo.name}`;
          const updatedLabel = formatDateTime(pr.updated_at);
          const isDraft = pr.draft && pr.state === "open";

          return (
            <li key={getPRKey(pr)}>
              <button
                type="button"
                onClick={() => onSelect(pr)}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition hover:shadow-sm",
                  theme === "dark"
                    ? "bg-gray-900 border-gray-700 hover:border-gray-600"
                    : "bg-white border-gray-200 hover:border-gray-300",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Icon className={iconClassName} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pr.title}</span>
                        {isDraft && (
                          <span
                            className={cn(
                              "text-[11px] px-2 py-0.5 rounded-full",
                              theme === "dark"
                                ? "bg-gray-700 text-gray-300"
                                : "bg-gray-100 text-gray-600",
                            )}
                          >
                            Draft
                          </span>
                        )}
                      </div>
                      <div
                        className={cn(
                          "text-xs mt-1",
                          theme === "dark" ? "text-gray-400" : "text-gray-500",
                        )}
                      >
                        {repoName} • #{pr.number} • by {pr.user.login}
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-xs whitespace-nowrap",
                      theme === "dark" ? "text-gray-400" : "text-gray-500",
                    )}
                  >
                    Updated {updatedLabel}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

export default function MeView() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { pullRequests } = usePRStore();
  const { theme } = useUIStore();

  const login = user?.login ?? "";

  const {
    openedByMe,
    reviewRequested,
    involved,
  } = useMemo(() => {
    if (!login) {
      return {
        openedByMe: [],
        reviewRequested: [],
        involved: [],
      };
    }

    const allPRs = Array.from(pullRequests.values());
    const opened = [] as PullRequest[];
    const review = [] as PullRequest[];
    const involvedPRs = [] as PullRequest[];

    const openedKeys = new Set<string>();
    const reviewKeys = new Set<string>();

    allPRs.forEach((pr) => {
      const key = getPRKey(pr);
      const isAuthor = matchesLogin(pr.user?.login, login);
      const isRequestedReviewer = pr.requested_reviewers?.some((reviewer) =>
        matchesLogin(reviewer.login, login),
      );
      const isAssignee = pr.assignees?.some((assignee) =>
        matchesLogin(assignee.login, login),
      );
      const isReviewer =
        pr.approvedBy?.some((reviewer) =>
          matchesLogin(reviewer.login, login),
        ) ||
        pr.changesRequestedBy?.some((reviewer) =>
          matchesLogin(reviewer.login, login),
        );

      if (isAuthor) {
        opened.push(pr);
        openedKeys.add(key);
      }

      if (isRequestedReviewer) {
        review.push(pr);
        reviewKeys.add(key);
      }

      if (isAuthor || isRequestedReviewer || isAssignee || isReviewer) {
        if (!openedKeys.has(key) && !reviewKeys.has(key)) {
          involvedPRs.push(pr);
        }
      }
    });

    opened.sort(sortByUpdated);
    review.sort(sortByUpdated);
    involvedPRs.sort(sortByUpdated);

    return {
      openedByMe: opened,
      reviewRequested: review,
      involved: involvedPRs,
    };
  }, [login, pullRequests]);

  const handleSelectPR = (pr: PullRequest) => {
    navigate(
      `/pulls/${pr.base.repo.owner.login}/${pr.base.repo.name}/${pr.number}`,
    );
  };

  return (
    <div
      className={cn(
        "flex-1 overflow-hidden flex flex-col",
        theme === "dark"
          ? "bg-gray-900 text-gray-100"
          : "bg-gray-50 text-gray-900",
      )}
    >
      <div
        className={cn(
          "border-b px-6 py-4",
          theme === "dark" ? "border-gray-700" : "border-gray-200",
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <h1 className="text-2xl font-semibold">Me</h1>
            </div>
            <p
              className={cn(
                "mt-1 text-sm",
                theme === "dark" ? "text-gray-400" : "text-gray-500",
              )}
            >
              Your pull requests, review assignments, and activity in one place.
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-9 h-9 rounded-full"
              />
              <div className="text-right">
                <div className="text-sm font-medium">{user.name}</div>
                <div
                  className={cn(
                    "text-xs",
                    theme === "dark" ? "text-gray-400" : "text-gray-500",
                  )}
                >
                  @{user.login}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <PRSection
            title="Opened by you"
            description="PRs you created, sorted by most recent activity."
            prs={openedByMe}
            theme={theme}
            emptyMessage="No pull requests authored yet."
            onSelect={handleSelectPR}
          />
          <PRSection
            title="Needs your review"
            description="Review requests assigned to you."
            prs={reviewRequested}
            theme={theme}
            emptyMessage="No review requests right now."
            onSelect={handleSelectPR}
          />
          <PRSection
            title="You’re involved"
            description="PRs where you’re an assignee or reviewer."
            prs={involved}
            theme={theme}
            emptyMessage="No other PRs with your involvement."
            onSelect={handleSelectPR}
          />
        </div>
      </div>
    </div>
  );
}
