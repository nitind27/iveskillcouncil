const sharp = require("sharp");
const path = require("path");

async function main() {
  const src = path.join(__dirname, "../public/logo/IVESDC LOGO-01.png");
  const out = path.join(__dirname, "../public/certificates/ivesdc-logo-cert.png");

  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // near-black → transparent
    if (r < 28 && g < 28 && b < 28) data[i + 3] = 0;
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize(520, null, { withoutEnlargement: true })
    .png()
    .toFile(out);

  console.log("wrote", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
