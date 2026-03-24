// =====================================
// 📁 src/quickadd/utils/formatPreview.ts
// =====================================

type ParsedEntry = {
  nickname: string;
  value: number;
  id: number;

  status?: string;
  confidence?: number;
  suggestion?: string;
};

export function formatPreview(entries: ParsedEntry[]): string {
  if (!entries.length) {
    return "⚠️ No data";
  }

  const maxNameLength = Math.max(...entries.map(e => e.nickname.length));

  // =====================================
  // 🔹 MAIN LIST
  // =====================================
  const mainList = entries
    .map((entry) => {
      const id = entry.id;
      const paddedName = entry.nickname.padEnd(maxNameLength, " ");

      return `[${id}] ${paddedName} → ${formatNumber(entry.value)}`;
    })
    .join("\n");

  // =====================================
  // 🔹 ACCURACY SECTION
  // =====================================
  const accuracyList = entries
    .map((entry) => {
      if (entry.confidence === undefined) return null;

      const percent = Math.round(entry.confidence * 100);

      let icon = "❔";
      if (percent >= 90) icon = "✅";
      else icon = "⚠️";

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
  // 🔹 BUILD FINAL OUTPUT
  // =====================================
  let output = `
📊 QuickAdd Preview

${mainList}

━━━━━━━━━━━━━━━━━━
`.trim();

  if (accuracyList) {
    output += `

📊 Nickname accuracy

${accuracyList}

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

✅ Correct entries  
⚠️ Needs review  

━━━━━━━━━━━━━━━━━━
`;

  return output.trim();
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}