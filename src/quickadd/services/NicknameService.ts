import { Entry } from "../session/SessionData";

function normalize(nick: string): string {
  return nick
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export class NicknameService {
  static async learn(entries: Entry[]) {
    console.log("🧠 Nickname learning start");

    const map = new Map<string, string>();

    for (const e of entries) {
      if (!e.rawNick || !e.nickname) continue;

      const raw = normalize(e.rawNick);
      const final = e.nickname;

      // 🔥 skip jeśli brak zmiany
      if (raw === normalize(final)) continue;

      // 🔥 filtr śmieci
      if (final.length < 3) continue;

      if (!map.has(raw)) {
        map.set(raw, final);
      }
    }

    const mappings = Array.from(map.entries()).map(([ocr, final]) => ({
      ocr,
      final,
    }));

    if (mappings.length === 0) {
      console.log("ℹ️ No nickname mappings to save");
      return;
    }

    console.log("💾 Saving nickname mappings:", mappings.length);

    // 🔥 tutaj podłączysz Google Sheets
    await this.saveMappings(mappings);
  }

  private static async saveMappings(
    mappings: { ocr: string; final: string }[]
  ) {
    // TODO: Google Sheets API
    console.log("📤 (mock) saved:", mappings);
  }
}