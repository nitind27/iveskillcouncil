/**
 * Soft-clean: only remove the sample achievement sentence.
 * Labels + blank lines stay so typed values sit on the printed form.
 */
const sharp = require("sharp");
const path = require("path");

const SRC = path.join(__dirname, "../public/certificates/ivesdc-certificate-template.jpg");
const OUT = path.join(__dirname, "../public/certificates/ivesdc-certificate-frame.jpg");

async function main() {
  const meta = await sharp(SRC).metadata();
  const W = meta.width || 723;
  const H = meta.height || 1024;

  // Achievement sample sits ~y 486 (ratio 0.475)
  const top = Math.round(H * 0.468);
  const left = Math.round(W * 0.095);
  const w = Math.round(W * 0.81);
  const h = Math.round(H * 0.022);

  const strip = Buffer.from(
    `<svg width="${w}" height="${h}">
      <rect width="100%" height="100%" fill="#f7f8fa"/>
    </svg>`
  );

  // Soft cover inside QR box (placeholder text)
  const qrTop = Math.round(H * 0.492);
  const qrLeft = Math.round(W * 0.715);
  const qrS = Math.round(W * 0.125);
  const qrPad = Buffer.from(
    `<svg width="${qrS}" height="${qrS}">
      <rect width="100%" height="100%" fill="#ffffff"/>
    </svg>`
  );

  await sharp(SRC)
    .composite([
      { input: strip, top, left },
      { input: qrPad, top: qrTop, left: qrLeft },
    ])
    .jpeg({ quality: 94 })
    .toFile(OUT);

  console.log(JSON.stringify({ out: OUT, W, H, strip: { top, left, w, h } }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
