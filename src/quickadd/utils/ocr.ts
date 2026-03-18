import Tesseract from "tesseract.js";

export async function extractTextFromImage(url: string): Promise<string> {
  const result = await Tesseract.recognize(url, "eng", {
    logger: () => {},
  });

  return result.data.text;
}