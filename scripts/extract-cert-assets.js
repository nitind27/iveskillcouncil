const sharp = require("sharp");
const path = require("path");

async function main() {
  const certPath = path.join(__dirname, "../public/cert/cert.jpeg");
  const resPath = path.join(__dirname, "../public/cert/res.jpeg");

  const meta = await sharp(certPath).metadata();
  const W = meta.width; // 1054
  const H = meta.height; // 1492
  const C = 3;

  console.log("Generating 100% pristine border assets for dimensions:", W, "x", H);

  // =========================================================================
  // 1. Pristine Border for cert.jpeg (Certificate of Completion)
  // Uses direct RAW PIXEL BUFFER manipulation to guarantee 0 stray pixels.
  // Preserves:
  //   - Outer ornate navy & gold floral guilloche border (x=0..45, y=0..48, bottom blue bar)
  //   - Thin golden frame lines (left x=52..54, right x=1000..1002, top y=56..58)
  //   - 4 golden corner flourishes (x=55..115, y=59..120; x=939..999, y=59..120; etc.)
  // Eliminates:
  //   - ALL stray lines, broken scanner dashes, dust, and artifacts in gutters (x=45..51, x=1003..1011)
  //   - ALL center content, old text, logos, stamps, signatures, QR, and Sr. No.
  // =========================================================================
  const { data: certData } = await sharp(certPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  function setCertWhite(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const idx = (y * W + x) * C;
    certData[idx] = 255;
    certData[idx + 1] = 255;
    certData[idx + 2] = 255;
  }

  // A. Left Gutter between outer border and golden line: x=45..51, y=49..1420
  for (let y = 49; y <= 1420; y++) {
    for (let x = 45; x <= 51; x++) {
      setCertWhite(x, y);
    }
  }

  // B. Right Gutter between golden line and outer border: x=1003..1011, y=49..1420
  for (let y = 49; y <= 1420; y++) {
    for (let x = 1003; x <= 1011; x++) {
      setCertWhite(x, y);
    }
  }

  // C. Top Gutter between outer border and top golden line: y=49..55, x=45..1011
  for (let y = 49; y <= 55; y++) {
    for (let x = 45; x <= 1011; x++) {
      setCertWhite(x, y);
    }
  }

  // D. Bottom Gutter above the blue footer: y=1414..1421, x=45..1011
  for (let y = 1414; y <= 1421; y++) {
    for (let x = 45; x <= 1011; x++) {
      setCertWhite(x, y);
    }
  }

  // E. Main Center Content Area:
  // 1) Between top and bottom corner flourishes (y=121..1354): full width inside golden frame x=55..999
  for (let y = 121; y <= 1354; y++) {
    for (let x = 55; x <= 999; x++) {
      setCertWhite(x, y);
    }
  }

  // 2) Top header area between top-left and top-right corner flourishes (y=59..120): x=116..938
  for (let y = 59; y <= 120; y++) {
    for (let x = 116; x <= 938; x++) {
      setCertWhite(x, y);
    }
  }

  // 3) Bottom area between bottom-left and bottom-right corner flourishes (y=1355..1418): x=116..938
  for (let y = 1355; y <= 1418; y++) {
    for (let x = 116; x <= 938; x++) {
      setCertWhite(x, y);
    }
  }

  await sharp(certData, { raw: { width: W, height: H, channels: C } })
    .png({ quality: 100 })
    .toFile(path.join(__dirname, "../public/cert/cert-border-pristine.png"));

  console.log("cert-border-pristine.png saved with raw pixel perfection!");

  // =========================================================================
  // 2. Pristine Border for res.jpeg (Statement of Marks)
  // Uses direct RAW PIXEL BUFFER manipulation.
  // Preserves outer blue guilloche border and golden inner framing.
  // Completely eliminates all stray lines, dashes, ticks, table boundaries,
  // and scanner artifacts inside the document and in all gutters.
  // =========================================================================
  const { data: resData } = await sharp(resPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  function setResWhite(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const idx = (y * W + x) * C;
    resData[idx] = 255;
    resData[idx + 1] = 255;
    resData[idx + 2] = 255;
  }

  // A. Inside Document Area: x=39..1013, y=38..1438
  // This completely wipes out all old divider lines, table borders, text ends,
  // and the old serial number right up to the golden frame.
  for (let y = 38; y <= 1438; y++) {
    for (let x = 39; x <= 1013; x++) {
      setResWhite(x, y);
    }
  }

  // B. Left Gutter: x=21..34, y=28..1438
  // Completely eliminates all stray blue dashes, ticks, and scanner lines
  // between the outer blue guilloche pattern and the golden frame.
  for (let y = 28; y <= 1438; y++) {
    for (let x = 21; x <= 34; x++) {
      setResWhite(x, y);
    }
  }

  // C. Right Gutter: x=1018..1033, y=28..1438
  // Completely eliminates all stray blue dashes and scanner lines on the right.
  for (let y = 28; y <= 1438; y++) {
    for (let x = 1018; x <= 1033; x++) {
      setResWhite(x, y);
    }
  }

  // D. Top Gutter: y=28..36, x=21..1033
  // Completely eliminates all stray blue lines on the top.
  for (let y = 28; y <= 36; y++) {
    for (let x = 21; x <= 1033; x++) {
      setResWhite(x, y);
    }
  }

  // E. Bottom Gutter: y=1430..1438, x=21..1033
  // Cleans the margin above the bottom blue footer bar.
  for (let y = 1430; y <= 1438; y++) {
    for (let x = 21; x <= 1033; x++) {
      setResWhite(x, y);
    }
  }

  await sharp(resData, { raw: { width: W, height: H, channels: C } })
    .png({ quality: 100 })
    .toFile(path.join(__dirname, "../public/cert/res-border-pristine.png"));

  console.log("res-border-pristine.png saved with raw pixel perfection!");

  // =========================================================================
  // 3. Pristine IVESDC Official Logo
  // Extracted with surgical precision strictly at x=70..279, y=58..209
  // (EXCLUDING all gold corner ornaments, golden borders, and vertical lines)
  // Background whitened to 100% pure white (#FFFFFF).
  // =========================================================================
  const { data: logoData, info: logoInfo } = await sharp(resPath)
    .extract({ left: 70, top: 58, width: 210, height: 152 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let y = 0; y < logoInfo.height; y++) {
    for (let x = 0; x < logoInfo.width; x++) {
      const idx = (y * logoInfo.width + x) * C;
      const r = logoData[idx], g = logoData[idx + 1], b = logoData[idx + 2];

      // Whiten any near-white / scanned paper background pixels
      if (r > 225 && g > 220 && b > 215) {
        logoData[idx] = 255;
        logoData[idx + 1] = 255;
        logoData[idx + 2] = 255;
      }
    }
  }

  await sharp(logoData, { raw: { width: logoInfo.width, height: logoInfo.height, channels: C } })
    .trim({ threshold: 5 })
    .png({ quality: 100 })
    .toFile(path.join(__dirname, "../public/cert/ivesdc-logo.png"));

  console.log("ivesdc-logo.png saved without any border line or corner flourish!");

  // =========================================================================
  // 4. Pristine Statement of Marks Title Cartouche Plaque Banner
  // High-resolution royal navy cartouche with gold outline and transparent background.
  // =========================================================================
  const bannerSource = path.join(__dirname, "../public/cert/statement-banner-source.png");
  const fs = require("fs");
  if (fs.existsSync(bannerSource)) {
    const { data: bData, info: bInfo } = await sharp(bannerSource)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const bW = bInfo.width;
    const bH = bInfo.height;
    const visited = new Uint8Array(bW * bH);
    const queue = [0, bW - 1, (bH - 1) * bW, bH * bW - 1];
    for (const q of queue) visited[q] = 1;

    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      const x = idx % bW;
      const y = Math.floor(idx / bW);
      const neighbors = [
        x > 0 ? idx - 1 : -1,
        x < bW - 1 ? idx + 1 : -1,
        y > 0 ? idx - bW : -1,
        y < bH - 1 ? idx + bW : -1,
      ];
      for (const n of neighbors) {
        if (n !== -1 && !visited[n]) {
          const pR = bData[n * 4];
          const pG = bData[n * 4 + 1];
          const pB = bData[n * 4 + 2];
          if (pR > 220 && pG > 215 && pB > 195) {
            visited[n] = 1;
            queue.push(n);
          }
        }
      }
    }

    const outBuf = Buffer.from(bData);
    for (let i = 0; i < bW * bH; i++) {
      if (visited[i]) outBuf[i * 4 + 3] = 0;
    }

    await sharp(outBuf, { raw: { width: bW, height: bH, channels: 4 } })
      .extract({ left: 19, top: 8, width: 609, height: 85 })
      .png({ quality: 100 })
      .toFile(path.join(__dirname, "../public/cert/res-statement-banner.png"));

    console.log("res-statement-banner.png saved with pristine transparent background & exact symmetry!");
  }
}

main().catch(console.error);
