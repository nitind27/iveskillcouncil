import { ROLES } from "@/lib/permissions";

export function canManageExams(roleId: number): boolean {
  return roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;
}

export function canViewExamResults(roleId: number): boolean {
  return (
    roleId === ROLES.SUPER_ADMIN ||
    roleId === ROLES.ADMIN ||
    roleId === ROLES.SUB_ADMIN
  );
}

export function canTakeExams(roleId: number): boolean {
  return roleId === ROLES.STUDENT;
}

/** Fisher–Yates shuffle (copy) */
export function shuffleIds<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function arraysEqualAsSets(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((x) => setB.has(x));
}
