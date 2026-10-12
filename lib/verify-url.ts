/** Public site encoded in every certificate and result QR. */
export const VERIFY_ORIGIN = "https://iveskillcouncil.org.in";

/**
 * Printed verify address. Saved edu.in values are ignored so every centre,
 * including Eklavya, prints the live council site.
 */
export function publicVerifySite(_value?: string | null): string {
  return VERIFY_ORIGIN;
}
