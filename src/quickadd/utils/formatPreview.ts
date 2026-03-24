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
  const maxValueLength = Math.max(
    ...entries.map(e => formatNumber(e.value).length)
  );

  const formattedEntries = entries
    .map((entry) => {
      const id = entry.id;

      const paddedName = entry.nickname.padEnd(maxNameLength, " ");
      const formattedValue = formatNumber(entry.value).padStart(maxValueLength, " ");

      // =====================================
      // 🔥 STATUS MAPPING
      // =====================================
      let statusIcon = "❔";
      let confidenceText = "";

      switch (entry.status) {
        case "OK":
          statusIcon = "✅";
          break;

        case "LOW_CONFIDENCE":
        case "DUPLICATE":
          statusIcon = "⚠️";
          break;

        case "UNRESOLVED":
        case "INVALID_VALUE":
          statusIcon = "❌";
          break;
      }

      // =====================================
      // 🔢 CONFIDENCE
      // =====================================
      if (entry.confidence !== undefined) {
        const percent = Math.round(entry.confidence * 100);
        confidenceText = ` (${percent}%)`;
      }

      // =====================================
      // 🧾 MAIN LINE (WITH ALIGN + MIDDLE DOT)
      // =====================================
      let line = `[${id}] ${paddedName} → ${formattedValue} · ${statusIcon}${confidenceText}`;

      // =====================================
      // 💡 SUGGESTION (NEW CLEAN FORMAT)
      // =====================================
      if (entry.suggestion && entry.suggestion !== entry.nickname) {
        line += `\n   ↳ suggestion: ${entry.suggestion}`;
      }

      return line;
    })
    .join("\n");

  const hasBlockingIssues = entries.some(
    e =>
      e.status === "UNRESOLVED" ||
      e.status === "INVALID_VALUE"
  );

  const hasWarnings = entries.some(
    e =>
      e.status === "LOW_CONFIDENCE" ||
      e.status === "DUPLICATE"
  );

  return `
📊 **QuickAdd Preview**
Entries: ${entries.length}

${formattedEntries}

━━━━━━━━━━━━━━━━━━

📘 **Legend**
✅ OK — ready  
⚠️ Needs review  
❌ Must fix  

━━━━━━━━━━━━━━━━━━

${
  hasBlockingIssues
    ? "❌ **Fix errors before confirming**\n\n"
    : hasWarnings
    ? "⚠️ **Some entries may need review**\n\n"
    : "✅ **All entries ready — you can confirm**\n\n"
}

✏️ **Adjust entry**

Use:
• id = entry number  
• field = nickname | value  
• value = new value  

Command:
→ /q adjust id:<id> field:<field> value:<value>

━━━━━━━━━━━━━━━━━━

🚀 **Next step**
→ /q confirm
`.trim();
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}