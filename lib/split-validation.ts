/** Validate that three split percentages sum to exactly 100%. */
export function validateSplitPercentages(
  pct1: number,
  pct2: number,
  pct3: number
): { valid: true } | { valid: false; error: string } {
  const values = [pct1, pct2, pct3];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v) || v < 0) {
      return { valid: false, error: `Beneficiary ${i + 1} percentage must be a non-negative number` };
    }
  }
  const total = Math.round((pct1 + pct2 + pct3) * 100) / 100;
  if (Math.abs(total - 100) > 0.001) {
    return {
      valid: false,
      error: `Split percentages must total exactly 100% (currently ${total}%)`,
    };
  }
  return { valid: true };
}

export function normalizeSplitPercentages(pct1: number, pct2: number, pct3: number) {
  return {
    beneficiary1Pct: Math.round(pct1 * 100) / 100,
    beneficiary2Pct: Math.round(pct2 * 100) / 100,
    beneficiary3Pct: Math.round(pct3 * 100) / 100,
  };
}
