// =====================================
// 📁 src/quickadd/utils/PreviewFormatter.ts
// =====================================

/**
 * 🖥️ ROLE:
 * Formats validated entries into user-friendly preview text.
 *
 * Responsible for:
 * - formatting entries list
 * - showing confidence indicators
 * - showing suggestions
 *
 * ❗ RULES:
 * - NO logic (only formatting)
 * - NO mutations
 * - pure function
 */

import { log } from "../logger";

type PreviewEntry = {
  id: number;
  nickname: string;
  value: number;

  status?: string;
  confidence?: number;
  suggestion?: string;
};

export function formatPreview(
  entries: PreviewEntry[],
  traceId: string
): string {
  if (!traceId) {
    throw new Error("traceId is required in formatPreview");
  }

  log.emit({
    event: "format_preview_start",
    traceId,
    data: {
      entries: entries.length,
    },
  });

  if (!entries.length) {
    log.emit({
      event: "format_preview_empty",
      traceId,
    });

    return "⚠️ No data";
  }

  const maxNameLength = Math.max(
    ...entries.map((e) => e.nickname.length)
  );

  // =====================================
  // 🔹 MAIN LIST
  // =====================================

  const mainList = entries
    .map((entry) => {
      const paddedName = entry.nickname.padEnd(maxNameLength, " ");

      return `[${entry.id}] ${paddedName} → ${formatNumber(entry.value)}`;
    })
    .join("\n");

  // =====================================
  // 🔹 CONFIDENCE
  // =====================================

  const confidenceList = entries
    .map((entry) => {
      if (entry.confidence === undefined) return null;

      const percent = Math.round(entry.confidence * 100);

      let icon = "❔";
      if (percent >= 90) icon = "✅";
      else if (percent >= 70) icon = "⚠️";
      else icon = "❌";

      return `[${entry.id}] ${icon} ${percent}%`;
    })
    .filter(Boolean)
    .join("\n");

  // =====================================
  // 🔹 SUGGESTIONS
  // =====================================

  const suggestions = entries
    .filter(
      (e) =>
        e.suggestion &&
        e.suggestion !== e.nickname
    )
    .map((e) => `[${e.id}] → ${e.suggestion}`)
    .join("\n");

  // =====================================
  // 🔹 BUILD OUTPUT
  // =====================================

  let output = `
📊 QuickAdd Preview

${mainList}

━━━━━━━━━━━━━━━━━━
`.trim();

  if (confidenceList) {
    output += `

📊 Nickname confidence

${confidenceList}

━━━━━━━━━━━━━━━━━━`;
  }

  if (suggestions) {
    output += `

💡 Suggested fixes

${suggestions}

━━━━━━━━━━━━━━━━━━`;
  }

  output += `

📘 Legend

✅ High confidence  
⚠️ Medium confidence  
❌ Low confidence  

━━━━━━━━━━━━━━━━━━
`;

  log.emit({
    event: "format_preview_done",
    traceId,
    data: {
      entries: entries.length,
      hasConfidence: !!confidenceList,
      hasSuggestions: !!suggestions,
      length: output.length,
    },
  });

  return output.trim();
}

// =====================================
// 🔧 HELPERS
// =====================================

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}