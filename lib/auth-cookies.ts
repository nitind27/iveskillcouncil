/** Shared auth cookie settings — keep access/refresh lifetimes consistent across login & refresh. */

export const ACCESS_TOKEN_MAX_AGE = 60 * 60; // 1 hour (seconds)
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export function getAuthCookieOptions(isProduction = process.env.NODE_ENV === "production") {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
  };
}
