import type { CertificateDisplayData } from "./certificate-display";
import { gradeFromPercent } from "./certificate-display";

export type CertificateOverrides = Partial<
  Omit<CertificateDisplayData, "id" | "status" | "isDraft">
>;

export function mergeCertificateData(
  base: CertificateDisplayData,
  overrides?: CertificateOverrides | null
): CertificateDisplayData {
  if (!overrides || typeof overrides !== "object") return base;
  const merged = {
    ...base,
    ...overrides,
    marksPercent:
      overrides.marksPercent !== undefined ? overrides.marksPercent : base.marksPercent,
  };
  if (merged.marksPercent != null) {
    const g = gradeFromPercent(merged.marksPercent);
    merged.grade = overrides.grade ?? g.grade;
    merged.gradeLabel = overrides.gradeLabel ?? g.label;
  }
  return merged;
}
