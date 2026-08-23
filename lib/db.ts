/**
 * Database connectivity helpers — Hostinger MySQL via local IPv6 proxy (127.0.0.1:3307).
 * Retries + clear unavailable detection stop false logouts / 503 spam.
 */

import { prisma } from "./prisma";

export function isDbUnavailableError(error: unknown): boolean {
  if (!error) return false;
  const name = (error as { name?: string })?.name ?? "";
  const code = (error as { code?: string })?.code ?? "";
  const msg = error instanceof Error ? error.message : String(error);

  if (name === "PrismaClientInitializationError") return true;
  if (name === "PrismaClientKnownRequestError" && (code === "P1001" || code === "P1017"))
    return true;
  if (code === "P1001" || code === "P1002" || code === "P1017" || code === "P2024")
    return true;

  return (
    msg.includes("Can't reach database server") ||
    msg.includes("DATABASE_UNAVAILABLE") ||
    msg.includes("Server has closed the connection") ||
    msg.includes("Connection reset") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("connect ETIMEDOUT") ||
    msg.includes("Connection refused") ||
    msg.includes("Timed out fetching a new connection") ||
    msg.includes("PrismaClientInitializationError")
  );
}

export class DatabaseUnavailableError extends Error {
  constructor(message = "DATABASE_UNAVAILABLE") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Soft reconnect when the proxy was down and comes back. */
export async function ensureDbConnected(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return;
  } catch (first) {
    if (!isDbUnavailableError(first)) throw first;
  }

  try {
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }

  await sleep(250);
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
}

/**
 * Run a DB operation with reconnect + exponential backoff.
 * Throws DatabaseUnavailableError if still unreachable after retries.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; baseDelayMs?: number }
): Promise<T> {
  const retries = options?.retries ?? 4;
  const baseDelayMs = options?.baseDelayMs ?? 400;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        try {
          await ensureDbConnected();
        } catch {
          /* still try fn — proxy may have just come up */
        }
      }
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isDbUnavailableError(error) || attempt === retries) break;
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(
        `[db] unreachable (attempt ${attempt + 1}/${retries + 1}), retry in ${delay}ms`
      );
      await sleep(delay);
    }
  }

  if (isDbUnavailableError(lastError)) {
    throw new DatabaseUnavailableError(
      lastError instanceof Error ? lastError.message : "DATABASE_UNAVAILABLE"
    );
  }
  throw lastError;
}
