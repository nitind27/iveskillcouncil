/** `/certificates/certificatebot.png` is 2171×724 with the logos inside this box; the rest is white margin. */
const SRC = "/certificates/certificatebot.png";
const IMG = { w: 2171, h: 724 };
const LOGOS = { top: 216, bottom: 505, left: 15, right: 2161 };

/**
 * Partner logo strip cropped to the logos themselves and fitted inside the strip (width and height),
 * so no logo is clipped by the frame — a plain `object-cover` crop cut the top of the Skill India logo.
 */
export default function PartnerLogos({ height, padding = 6 }: { height: number; padding?: number }) {
  const logoH = LOGOS.bottom - LOGOS.top;
  const pad = (padding / Math.max(1, height - padding * 2)) * logoH;
  const viewBox = [
    LOGOS.left - pad,
    LOGOS.top - pad,
    LOGOS.right - LOGOS.left + pad * 2,
    logoH + pad * 2,
  ].join(" ");

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full select-none"
      style={{ height }}
      role="img"
      aria-label="Partner logos"
    >
      <image href={SRC} x={0} y={0} width={IMG.w} height={IMG.h} />
    </svg>
  );
}
