import { useEffect } from "react";
import { useOrganizationSyncStore } from "../../stores/organizationSyncStore";
import { useUIStore } from "../../stores/uiStore";
import { cn } from "../../utils/cn";
import { Loader } from "lucide-react";

export default function OrganizationsTab() {
  const { theme } = useUIStore();
  const { organizations, loading, fetchUserOrganizations, toggleOrgSync } =
    useOrganizationSyncStore();

  useEffect(() => {
    fetchUserOrganizations();
  }, [fetchUserOrganizations]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2
          className={cn(
            "text-lg font-semibold mb-2",
            theme === "dark" ? "text-white" : "text-gray-900",
          )}
        >
          Organizations
        </h2>
        <p
          className={cn(
            "text-sm",
            theme === "dark" ? "text-gray-400" : "text-gray-600",
          )}
        >
          Toggle which organizations to sync. Team members from enabled organizations will be available for mentions.
        </p>
      </div>

      {loading ? (
        <div
          className={cn(
            "flex items-center justify-center py-8",
            theme === "dark" ? "text-gray-400" : "text-gray-600",
          )}
        >
          <Loader className="w-5 h-5 mr-2 animate-spin" />
          Loading organizations...
        </div>
      ) : organizations.length === 0 ? (
        <div
          className={cn(
            "p-8 text-center rounded-lg border-2 border-dashed",
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500",
          )}
        >
          <p>No organizations found.</p>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-lg border overflow-hidden",
            theme === "dark" ? "border-gray-700" : "border-gray-200",
          )}
        >
          <div className="divide-y">
            {organizations.map((org) => (
              <div
                key={org.login}
                className={cn(
                  "flex items-center gap-4 p-4",
                  theme === "dark"
                    ? "bg-gray-800 hover:bg-gray-750 border-gray-700"
                    : "bg-white hover:bg-gray-50 border-gray-200",
                )}
              >
                <img
                  src={org.avatar_url}
                  alt={org.login}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-medium",
                      theme === "dark" ? "text-white" : "text-gray-900",
                    )}
                  >
                    {org.login}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={org.isSyncing}
                  onChange={(e) =>
                    toggleOrgSync(org.login, e.target.checked)
                  }
                  className={cn(
                    "rounded focus:ring-blue-500 cursor-pointer",
                    theme === "dark"
                      ? "border-gray-600 bg-gray-700 text-blue-500"
                      : "border-gray-300 bg-white text-blue-600",
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {organizations.length > 0 && (
        <div
          className={cn(
            "mt-4 text-sm",
            theme === "dark" ? "text-gray-400" : "text-gray-600",
          )}
        >
          {organizations.filter((o) => o.isSyncing).length} of{" "}
          {organizations.length} organization{organizations.length !== 1 ? "s" : ""}{" "}
          enabled
        </div>
      )}
    </div>
  );
}
