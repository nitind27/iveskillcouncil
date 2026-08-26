/** Walk-in exam attempt auth helpers (browser) */

export function getExamAccessKey(attemptId: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(`exam_access_${attemptId}`);
}

export function examAccessHeaders(attemptId: string): HeadersInit {
  const key = getExamAccessKey(attemptId);
  return key ? { "x-exam-access-key": key } : {};
}

export async function examAccessFetcher<T = unknown>(
  url: string,
  attemptId: string
): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: examAccessHeaders(attemptId),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return (json.data ?? json) as T;
}
