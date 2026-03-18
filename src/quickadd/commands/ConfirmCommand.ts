// ConfirmCommand.ts
// Komenda do zatwierdzenia danych z PreviewBuffer

import { PreviewBuffer } from "../services/PreviewBuffer";
import { SessionManager } from "../services/SessionManager";
import { PointsService } from "../services/PointsService";

export class ConfirmCommand {
  static name = "confirm";

  async execute() {
    if (!SessionManager.hasActiveSession()) {
      throw new Error("Brak aktywnej sesji QuickAdd.");
    }

    const entries = PreviewBuffer.getAll();
    const errors = entries.filter(e => e.flags.some(f => ["DUPLICATE", "UNREADABLE", "INVALID"].includes(f)));

    if (errors.length > 0) {
      throw new Error("Nie można zatwierdzić. W PreviewBuffer są błędy.");
    }

    // TODO: zapis do serwisu docelowego
    await PointsService.save(entries);

    SessionManager.closeSession();
    PreviewBuffer.clear();

    return "Dane zostały zapisane pomyślnie.";
  }
}