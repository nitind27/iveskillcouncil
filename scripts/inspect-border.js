const sharp = require("sharp");

async function checkBackgroundPattern() {
  const { data: certData, info: certInfo } = await sharp("public/cert/cert.jpeg")
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: resData, info: resInfo } = await sharp("public/cert/res.jpeg")
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Let's zoom into an empty white patch of cert.jpeg, e.g. x=300..450, y=300..450
  // and amplify the contrast to see if there is a faint security pattern or watermark!
  await sharp("public/cert/cert.jpeg")
    .extract({ left: 300, top: 300, width: 250, height: 250 })
    .linear(5.0, -1000) // high contrast amplification
    .toFile("public/cert/test-cert-bg-contrast.png");

  // Same for res.jpeg
  await sharp("public/cert/res.jpeg")
    .extract({ left: 300, top: 300, width: 250, height: 250 })
    .linear(5.0, -1000)
    .toFile("public/cert/test-res-bg-contrast.png");

  console.log("Contrast amplified background patches created!");
}
checkBackgroundPattern();
