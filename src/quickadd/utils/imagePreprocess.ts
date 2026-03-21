// src/quickadd/utils/imagePreprocess.ts
import sharp from "sharp";

// =====================================
// 🧠 MAIN PREPROCESS (lekko ulepszony)
// =====================================
export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .grayscale()                 // usuwa kolory
    .normalize()                 // poprawia kontrast
    .linear(1.2, -20)            // 🔥 boost kontrastu (lepszy niż sam normalize)
    .sharpen()                   // wyostrza tekst
    .threshold(140)              // 🔥 niższy threshold (nie zabija cienkich fontów)
    .toBuffer();
}

// =====================================
// ✂️ SPLIT NA WIERSZE (GAME CHANGER)
// =====================================
export async function splitIntoRows(buffer: Buffer): Promise<Buffer[]> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  const width = metadata.width!;
  const height = metadata.height!;

  console.log("🧩 IMAGE DIMENSIONS:", { width, height });

  // 🔧 DO DOSTROJENIA (ale już powinno działać dobrze)
  const START_Y = Math.floor(height * 0.22);
  const ROW_HEIGHT = Math.floor(height * 0.055);
  const ROW_COUNT = 33;

  console.log("🧩 ROW CONFIG:", {
    START_Y,
    ROW_HEIGHT,
    ROW_COUNT,
  });

  const rows: Buffer[] = [];

  for (let i = 0; i < ROW_COUNT; i++) {
    const top = START_Y + i * ROW_HEIGHT;

    // zabezpieczenie żeby nie wyjść poza obraz
    if (top + ROW_HEIGHT > height) break;

    const row = await image
      .extract({
        left: 0,
        top,
        width,
        height: ROW_HEIGHT,
      })
      .toBuffer();

    rows.push(row);
  }

  console.log("🧩 ROWS EXTRACTED:", rows.length);

  return rows;
}