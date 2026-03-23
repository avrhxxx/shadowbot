// =====================================
// 📁 src/quickadd/utils/formatPreview.ts
// =====================================

type ParsedEntry = {
  nickname: string;
  value: number;
  id: number; // 🔥 FIX
};

export function formatPreview(entries: ParsedEntry[]): string {
  if (!entries.length) {
    return "⚠️ No data";
  }

  const maxNameLength = Math.max(...entries.map(e => e.nickname.length));

  const formattedEntries = entries
    .map((entry) => {
      const id = entry.id; // 🔥 FIX

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
`.trim();
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}