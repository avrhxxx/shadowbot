// =====================================
// 📁 src/system/translation/translationService.ts
// =====================================

import {
  TRANSLATION_PROVIDERS,
  DEFAULT_PROVIDER_ORDER,
} from "./translationConfig";
import LRUCache from "lru-cache";

// =====================================
// 🔧 CACHE
// =====================================

const cache = new LRUCache<string, string>({
  max: 500,
  ttl: 1000 * 60 * 10,
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
// 🔌 PROVIDERS
// =====================================

async function tryLibre(
  text: string,
  target: string
): Promise<string | null> {
  const url = TRANSLATION_PROVIDERS.libre.url;

  try {
    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "auto",
        target,
        format: "text",
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as LibreResponse;

    if (typeof data.translatedText === "string") {
      return data.translatedText;
    }
  } catch {}

  return null;
}

async function tryGoogleFree(
  text: string,
  target: string
): Promise<string | null> {
  const url = TRANSLATION_PROVIDERS.googleFree.url;

  try {
    const params = new URLSearchParams({
      client: "gtx",
      sl: "auto",
      tl: target,
      dt: "t",
      q: text,
    });

    const res = await fetchWithTimeout(`${url}?${params.toString()}`);

    const data = (await res.json()) as GoogleResponse;

    if (
      Array.isArray(data) &&
      Array.isArray(data[0]) &&
      Array.isArray(data[0][0]) &&
      typeof data[0][0][0] === "string"
    ) {
      return data[0][0][0];
    }
  } catch {}

  return null;
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
  // PROVIDER LOOP
  // =============================
  for (const provider of DEFAULT_PROVIDER_ORDER) {
    let result: string | null = null;

    if (provider === "libre") {
      result = await tryLibre(text, target);
    }

    if (provider === "googleFree") {
      result = await tryGoogleFree(text, target);
    }

    if (result) {
      cache.set(key, result);
      return result;
    }
  }

  return "Translation failed.";
}