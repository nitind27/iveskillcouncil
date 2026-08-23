/** Official IVESDC certificate — 724×1024 reference image */
export const CERT_IMAGE = {
  src: "/certificates/ivesdc-frame-reference.png",
  width: 724,
  height: 1024,
} as const;

/**
 * White panel covers the form block on the template (sample text hidden).
 * Tuned for ivesdc-frame-reference.png
 */
export const FORM_PANEL = {
  top: 0.292,
  left: 0.088,
  width: 0.824,
  height: 0.268,
} as const;

export function buildAchievementText(
  courseName: string,
  grade: string,
  marksPercent: number | null
) {
  if (marksPercent != null && marksPercent > 0) {
    return `Has successfully completed the Course on ${courseName} and obtained Grade ${grade} (${marksPercent}% Marks).`;
  }
  return `Has successfully completed the Course on ${courseName}.`;
}

export function pct(ratio: number, total: number) {
  return Math.round(ratio * total);
}
