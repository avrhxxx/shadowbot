// PreviewCommand.ts
// Komenda do wyświetlenia aktualnego stanu PreviewBuffer

import { PreviewBuffer } from "../services/PreviewBuffer";
import { PreviewFormatter } from "../services/PreviewFormatter";
import { SessionManager } from "../services/SessionManager";

export class PreviewCommand {
  static name = "preview";

  async execute() {
    if (!SessionManager.hasActiveSession()) {
      throw new Error("Brak aktywnej sesji QuickAdd.");
    }

    const entries = PreviewBuffer.getAll();
    if (entries.length === 0) {
      throw new Error("PreviewBuffer jest pusty.");
    }

    return PreviewFormatter.format(entries);
  }
}