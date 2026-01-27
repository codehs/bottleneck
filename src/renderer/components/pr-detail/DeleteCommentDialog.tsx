import { AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "../../utils/cn";

interface DeleteCommentDialogProps {
  theme: "dark" | "light";
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteCommentDialog({
  theme,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteCommentDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={cn(
          "rounded-lg shadow-xl p-6 max-w-md w-full mx-4",
          theme === "dark"
            ? "bg-gray-800 border border-gray-700"
            : "bg-white border border-gray-200",
        )}
      >
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <h2 className="text-lg font-semibold">Delete Comment</h2>
        </div>

        <p
          className={cn(
            "text-sm mb-4",
            theme === "dark" ? "text-gray-300" : "text-gray-700",
          )}
        >
          Are you sure you want to delete this comment? This action cannot be
          undone.
        </p>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="btn btn-secondary text-sm"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              "btn text-sm text-white",
              "bg-red-600 hover:bg-red-700",
              isDeleting && "opacity-50 cursor-not-allowed",
            )}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
