// =====================================
// 📁 src/quickadd/utils/formatPreview.ts
// =====================================

type ParsedEntry = {
  nickname: string;
  value: number;
  id: number;
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

      return `[${id}] ${paddedName} → ${formatNumber(entry.value)}`;
    })
    .join("\n");

  return `
📊 **QuickAdd Preview**
Entries: ${entries.length}

${formattedEntries}

━━━━━━━━━━━━━━━━━━

✏️ **Adjust entry**

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