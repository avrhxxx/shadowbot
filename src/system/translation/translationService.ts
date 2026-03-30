// =====================================
// 📁 src/system/translation/translationService.ts
// =====================================

import fetch from "node-fetch";
import { LIBRE_URL, GOOGLE_URL } from "./translationConfig";

type LibreResponse = {
  translatedText?: string;
};

type GoogleResponse = string[][][];

export async function translateText(
  text: string,
  target: string
): Promise<string> {
  // =============================
  // LIBRE
  // =============================
  try {
    const res = await fetch(LIBRE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "auto",
        target,
        format: "text"
      })
    });

    if (res.ok) {
      const data = (await res.json()) as LibreResponse;

      if (typeof data.translatedText === "string") {
        return data.translatedText;
      }
    }
  } catch {
    // silent fallback
  }

  // =============================
  // GOOGLE FALLBACK
  // =============================
  try {
    const params = new URLSearchParams({
      client: "gtx",
      sl: "auto",
      tl: target,
      dt: "t",
      q: text
    });

    const res = await fetch(`${GOOGLE_URL}?${params.toString()}`);
    const data = (await res.json()) as GoogleResponse;

    if (
      Array.isArray(data) &&
      Array.isArray(data[0]) &&
      Array.isArray(data[0][0]) &&
      typeof data[0][0][0] === "string"
    ) {
      return data[0][0][0];
    }
  } catch {
    // silent fallback
  }

  return "Translation failed.";
}