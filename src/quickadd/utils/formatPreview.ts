// =====================================
// 📁 src/quickadd/utils/formatPreview.ts
// =====================================

type ParsedEntry = {
  nickname: string;
  value: number;
};

export function formatPreview(entries: ParsedEntry[]): string {
  if (!entries.length) {
    return "⚠️ No data";
  }

  // 🔥 calculate padding for alignment
  const maxNameLength = Math.max(...entries.map(e => e.nickname.length));

  const formattedEntries = entries
    .map((entry, index) => {
      const id = index + 1;

      const paddedName = entry.nickname.padEnd(maxNameLength, " ");

      return `[${id}] ${paddedName} → ${formatNumber(entry.value)}`;
    })
    .join("\n");

  return `
📊 QuickAdd Preview (${entries.length} entries)

${formattedEntries}

────────────────────────────

✏️ Adjust entry

Use:
→ id = entry number
→ field = value | nickname
→ value = new value

Commands:
→ /qa adjust id:<index> field:<field> value:<value>
→ /quickadd adjust id:<index> field:<field> value:<value>

Example:
→ /qa adjust id:1 field:value value:60000

💡 Pro tip:
Fix OCR mistakes like wrong numbers or nicknames.
`.trim();
}

// =====================================
// 🔢 NUMBER FORMATTER
// =====================================
function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}