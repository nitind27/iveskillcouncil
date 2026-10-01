"use client";

import { useEffect, useState } from "react";

const SCAN_MAX = 400;
const OUTPUT_MAX = 1200;
const cacheByUrl = new Map<string, string>();

/** True when the pixel is background: transparent, or near-white on opaque images. */
function isBackground(data: Uint8ClampedArray, i: number) {
  return data[i + 3] < 24 || (data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245);
}

/**
 * Returns a copy of the image with its empty (transparent / white) margins cropped away,
 * so logos uploaded with large padding still fill their slot. Falls back to the original URL.
 */
export function useTrimmedImage(src: string | null | undefined): string | null {
  const [trimmed, setTrimmed] = useState<string | null>(() => (src ? cacheByUrl.get(src) ?? null : null));

  useEffect(() => {
    if (!src) {
      setTrimmed(null);
      return;
    }
    const hit = cacheByUrl.get(src);
    if (hit) {
      setTrimmed(hit);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      let result = src;
      try {
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        const k = Math.min(1, SCAN_MAX / Math.max(nw, nh));
        const sw = Math.max(1, Math.round(nw * k));
        const sh = Math.max(1, Math.round(nh * k));
        const scan = document.createElement("canvas");
        scan.width = sw;
        scan.height = sh;
        const sctx = scan.getContext("2d", { willReadFrequently: true });
        if (!sctx) throw new Error("no canvas");
        sctx.drawImage(img, 0, 0, sw, sh);
        const { data } = sctx.getImageData(0, 0, sw, sh);

        let top = sh;
        let left = sw;
        let right = -1;
        let bottom = -1;
        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) {
            if (isBackground(data, (y * sw + x) * 4)) continue;
            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
          }
        }

        if (right >= left && bottom >= top) {
          const pad = 2;
          const cx = Math.max(0, (left - pad) / k);
          const cy = Math.max(0, (top - pad) / k);
          const cw = Math.min(nw, (right + 1 + pad) / k) - cx;
          const ch = Math.min(nh, (bottom + 1 + pad) / k) - cy;
          if (cw < nw * 0.98 || ch < nh * 0.98) {
            const o = Math.min(1, OUTPUT_MAX / Math.max(cw, ch));
            const out = document.createElement("canvas");
            out.width = Math.round(cw * o);
            out.height = Math.round(ch * o);
            out.getContext("2d")?.drawImage(img, cx, cy, cw, ch, 0, 0, out.width, out.height);
            result = out.toDataURL("image/png");
          }
        }
      } catch {
        result = src;
      }
      cacheByUrl.set(src, result);
      setTrimmed(result);
    };
    img.onerror = () => {
      if (!cancelled) setTrimmed(src);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return trimmed;
}
