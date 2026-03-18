// CancelCommand.ts
// Komenda do anulowania sesji QuickAdd

import { SessionManager } from "../services/SessionManager";
import { PreviewBuffer } from "../services/PreviewBuffer";

export class CancelCommand {
  static name = "cancel";

  async execute() {
    if (!SessionManager.hasActiveSession()) {
      throw new Error("Brak aktywnej sesji QuickAdd.");
    }

    PreviewBuffer.clear();
    SessionManager.closeSession();

    return "Sesja została anulowana.";
  }
}