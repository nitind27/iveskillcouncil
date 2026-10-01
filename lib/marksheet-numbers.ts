import path from "path";
import { promises as fs } from "fs";

/**
 * Sequential Statement of Marks numbers (00001, 00002, …).
 * A student gets a number the first time their marksheet is generated and keeps it forever.
 */
type Store = {
  last: number;
  students: Record<string, { no: string; assignedAt: string }>;
};

const FILE_PATH = path.join(process.cwd(), "data", "marksheet-numbers.json");
const DIGITS = 5;

export function formatMarksheetNo(n: number): string {
  return String(n).padStart(DIGITS, "0");
}

export function isMarksheetNoFormat(value: string): boolean {
  return /^\d{5,}$/.test(String(value || "").trim());
}

async function readStore(): Promise<Store> {
  try {
    const parsed = JSON.parse(await fs.readFile(FILE_PATH, "utf-8"));
    if (parsed && typeof parsed === "object") {
      return {
        last: Number(parsed.last) || 0,
        students: parsed.students && typeof parsed.students === "object" ? parsed.students : {},
      };
    }
  } catch {
    // first run
  }
  return { last: 0, students: {} };
}

async function writeStore(store: Store) {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  const tmp = `${FILE_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
  await fs.rename(tmp, FILE_PATH);
}

// Route bundles can load separate copies of this module, so the lock lives on globalThis.
const g = globalThis as unknown as { __marksheetNoLock?: Promise<unknown> };

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = g.__marksheetNoLock ?? Promise.resolve();
  const run = prev.then(fn, fn);
  g.__marksheetNoLock = run.catch(() => undefined);
  return run;
}

export async function getMarksheetNumber(studentId: string | bigint): Promise<string | null> {
  const store = await readStore();
  return store.students[String(studentId)]?.no ?? null;
}

/** Returns each student's number, assigning the next free ones (in the given order) to new students. */
export function assignMarksheetNumbers(studentIds: (string | bigint)[]): Promise<Record<string, string>> {
  return withLock(async () => {
    const store = await readStore();
    const result: Record<string, string> = {};
    let changed = false;
    for (const raw of studentIds) {
      const id = String(raw);
      if (!id) continue;
      let entry = store.students[id];
      if (!entry) {
        store.last += 1;
        entry = { no: formatMarksheetNo(store.last), assignedAt: new Date().toISOString() };
        store.students[id] = entry;
        changed = true;
      }
      result[id] = entry.no;
    }
    if (changed) await writeStore(store);
    return result;
  });
}

export async function findStudentIdByMarksheetNo(no: string): Promise<string | null> {
  const wanted = String(no || "").trim();
  if (!isMarksheetNoFormat(wanted)) return null;
  const store = await readStore();
  for (const [studentId, entry] of Object.entries(store.students)) {
    if (entry.no === wanted) return studentId;
  }
  return null;
}
