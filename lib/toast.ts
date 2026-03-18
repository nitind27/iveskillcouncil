/**
 * Toast notifications using react-toastify.
 * Success/error/info/warning show as toasts; confirm dialogs use native confirm().
 */

import { toast } from "react-toastify";

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

/** Delete/action confirmation using native confirm. */
export function showDeleteConfirm(
  title: string = "Are you sure?",
  message: string = "You won't be able to revert this!"
): Promise<{ isConfirmed: boolean }> {
  const text = message ? `${title}\n\n${message}` : title;
  const isConfirmed = typeof window !== "undefined" && window.confirm(text);
  return Promise.resolve({ isConfirmed: !!isConfirmed });
}

/** Generic confirm dialog. */
export function showConfirm(
  title: string,
  message?: string
): Promise<{ isConfirmed: boolean }> {
  const text = message ? `${title}\n\n${message}` : title;
  const isConfirmed = typeof window !== "undefined" && window.confirm(text);
  return Promise.resolve({ isConfirmed: !!isConfirmed });
}

export { toast };
