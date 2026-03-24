// =====================================
// 📁 src/quickadd/utils/formatPreview.ts
// =====================================

type ParsedEntry = {
  nickname: string;
  value: number;
  id: number;

  // 🔥 NEW (optional)
  status?: string;
  confidence?: number;
  suggestion?: string;
};

export function formatPreview(entries: ParsedEntry[]): string {
  if (!entries.length) {
    return "⚠️ No data";
  }

  const maxNameLength = Math.max(...entries.map(e => e.nickname.length));

  const formattedEntries = entries
    .map((entry) => {
      const id = entry.id;

      const paddedName = entry.nickname.padEnd(maxNameLength, " ");

      // 🔥 STATUS ICON
      let statusIcon = "";
      if (entry.status === "ERROR") statusIcon = "❌";
      else if (entry.status === "WARNING") statusIcon = "⚠️";
      else if (entry.status === "OK") statusIcon = "✅";

      let line = `[${id}] ${paddedName} → ${formatNumber(entry.value)} ${statusIcon}`;

      // 🔥 SUGGESTION
      if (entry.suggestion && entry.suggestion !== entry.nickname) {
        line += `\n   💡 suggestion: ${entry.suggestion}`;
      }

      return line;
    })
    .join("\n");

  const hasIssues = entries.some(e => e.status && e.status !== "OK");

  return `
📊 **QuickAdd Preview**
Entries: ${entries.length}

${formattedEntries}

━━━━━━━━━━━━━━━━━━

${hasIssues ? "⚠️ **Some entries require attention before confirm**\n\n" : ""}✏️ **Adjust entry**

Use:
• id = entry number  
• field = nickname | value  
• value = new value  

Command:
→ /q adjust id:<id> field:<field> value:<value>
`.trim();
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}