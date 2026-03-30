// =====================================
// 📁 src/system/translation/translationService.ts
// =====================================

import { LIBRE_URL, GOOGLE_URL } from "./translationConfig";
import LRUCache from "lru-cache";

// =====================================
// 🔧 CACHE
// =====================================

const cache = new LRUCache<string, string>({
  max: 500,
  ttl: 1000 * 60 * 10, // 10 min
});

// =====================================
// 🔧 TYPES
// =====================================

type LibreResponse = {
  translatedText?: string;
};

type GoogleResponse = string[][][];

// =====================================
// 🔧 HELPERS
// =====================================

function buildCacheKey(text: string, target: string): string {
  return `${text.trim().toLowerCase()}::${target}`;
}

async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
  timeout = 5000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(id);
  }
}

// =====================================
// 🌍 TRANSLATE
// =====================================

export async function translateText(
  text: string,
  target: string
): Promise<string> {
  const key = buildCacheKey(text, target);

  // =============================
  // CACHE
  // =============================
  const cached = cache.get(key);
  if (cached) return cached;

  // =============================
  // LIBRE
  // =============================
  try {
    const res = await fetchWithTimeout(LIBRE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "auto",
        target,
        format: "text",
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as LibreResponse;

      if (typeof data.translatedText === "string") {
        cache.set(key, data.translatedText);
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
      q: text,
    });

    const res = await fetchWithTimeout(
      `${GOOGLE_URL}?${params.toString()}`
    );

    const data = (await res.json()) as GoogleResponse;

    if (
      Array.isArray(data) &&
      Array.isArray(data[0]) &&
      Array.isArray(data[0][0]) &&
      typeof data[0][0][0] === "string"
    ) {
      const result = data[0][0][0];

      cache.set(key, result);

      return result;
    }
  } catch {
    // silent fallback
  }

  return "Translation failed.";
}