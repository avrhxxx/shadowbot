import sharp from "sharp";

export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .grayscale()              // 🔥 usuwa kolory (zielony highlight OUT)
    .normalize()              // 🔥 poprawia kontrast
    .sharpen()                // 🔥 wyostrza tekst
    .threshold(150)           // 🔥 robi czarno-białe (mega ważne)
    .toBuffer();
}