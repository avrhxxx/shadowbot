import { SessionManager } from "../session/SessionManager";
import { QuickAddService } from "../services/QuickAddService";

export class ConfirmCommand {
  static name = "confirm";

  constructor(private quickAddService: QuickAddService) {}

  async execute(guildId: string): Promise<string> {
    const sessionManager = SessionManager.getInstance();

    const session = sessionManager.getSession(guildId);

    if (!session) {
      throw new Error("Brak aktywnej sesji QuickAdd.");
    }

    const entries = session.previewBuffer.getAllEntries();

    if (!entries.length) {
      throw new Error("Brak danych do zatwierdzenia.");
    }

    const hasErrors = entries.some(e =>
      e.flags?.some(f =>
        ["DUPLICATE", "UNREADABLE", "INVALID"].includes(f)
      )
    );

    if (hasErrors) {
      throw new Error("Nie można zatwierdzić. W danych są błędy.");
    }

    // 🔥 KLUCZOWE
    await this.quickAddService.confirm(session);

    // zamknięcie sesji
    sessionManager.endSession(guildId);

    return "Dane zostały zapisane pomyślnie.";
  }
}