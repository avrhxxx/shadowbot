import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient();

export async function extractTextGoogle(buffer: Buffer): Promise<string> {
  const [result] = await client.documentTextDetection({
    image: { content: buffer },
  });

  return result.fullTextAnnotation?.text || "";
}