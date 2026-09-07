const sharp = require("sharp");
const path = require("path");

const SRC = path.join(__dirname, "../public/certificates/ivesdc-certificate-template.jpg");
const OUT = path.join(__dirname, "../public/certificates/ivesdc-border-only.jpg");

async function main() {
  const meta = await sharp(SRC).metadata();
  const W = meta.width || 723;
  const H = meta.height || 1024;
  const insetX = Math.round(W * 0.055);
  const insetY = Math.round(H * 0.042);
  const iw = W - insetX * 2;
  const ih = H - insetY * 2;

  const paper = Buffer.from(
    `<svg width="${iw}" height="${ih}">
      <defs>
        <pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="#f9fafb"/>
          <path d="M14 2 L26 14 L14 26 L2 14 Z" fill="none" stroke="#e8eef5" stroke-width="0.6" opacity="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#p)"/>
    </svg>`
  );

  await sharp(SRC)
    .composite([{ input: paper, top: insetY, left: insetX }])
    .jpeg({ quality: 94 })
    .toFile(OUT);

  console.log({ out: OUT, W, H, insetX, insetY });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
