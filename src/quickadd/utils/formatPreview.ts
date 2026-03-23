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

  return entries
    .map((entry, index) => {
      const id = index + 1;

      return `[${id}] ${entry.nickname} → ${entry.value}`;
    })
    .join("\n");
}