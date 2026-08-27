/**
 * Toast notifications using react-toastify.
 * Confirm / delete use a proper modal (ConfirmDialogHost), not window.alert.
 */

import { toast } from "react-toastify";
import { openConfirmDialog } from "@/components/common/ConfirmDialog";

function formatMessage(title: string, message?: string): string {
  return message ? `${title}\n${message}` : title;
}

/** Show success toast. Returns a resolved promise so existing await showSuccess() still works. */
export function showSuccess(title: string, message?: string): Promise<{ isConfirmed: true }> {
  toast.success(formatMessage(title, message));
  return Promise.resolve({ isConfirmed: true });
}

/** Show error toast. */
export function showError(title: string, message?: string): Promise<{ isConfirmed: true }> {
  toast.error(formatMessage(title, message));
  return Promise.resolve({ isConfirmed: true });
}

/** Show info toast. */
export function showInfo(title: string, message?: string): Promise<{ isConfirmed: true }> {
  toast.info(formatMessage(title, message));
  return Promise.resolve({ isConfirmed: true });
}

/** Show warning toast. */
export function showWarning(title: string, message?: string): Promise<{ isConfirmed: true }> {
  toast.warning(formatMessage(title, message));
  return Promise.resolve({ isConfirmed: true });
}

/** Delete confirmation modal (danger style). */
export function showDeleteConfirm(
  title: string = "Are you sure?",
  message: string = "You won't be able to revert this!"
): Promise<{ isConfirmed: boolean }> {
  if (typeof window === "undefined") {
    return Promise.resolve({ isConfirmed: false });
  }
  return openConfirmDialog({
    title,
    message,
    variant: "danger",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
  });
}

/** Generic confirm modal. */
export function showConfirm(
  title: string,
  message?: string
): Promise<{ isConfirmed: boolean }> {
  if (typeof window === "undefined") {
    return Promise.resolve({ isConfirmed: false });
  }
  return openConfirmDialog({
    title,
    message,
    variant: "default",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
  });
}

export { toast };
