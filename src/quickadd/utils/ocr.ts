import Tesseract from "tesseract.js";

export async function extractTextFromImage(image: Buffer): Promise<string> {
  const result = await Tesseract.recognize(image, "eng", {
    logger: () => {},
  });

  return result.data.text;
}