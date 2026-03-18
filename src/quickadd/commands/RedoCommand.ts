// RedoCommand.ts
// Komenda do wyczyszczenia PreviewBuffer i rozpoczęcia ponownie zbierania danych

import { SessionManager } from "../services/SessionManager";
import { PreviewBuffer } from "../services/PreviewBuffer";

export class RedoCommand {
  static name = "redo";

  async execute() {
    if (!SessionManager.hasActiveSession()) {
      throw new Error("Brak aktywnej sesji QuickAdd.");
    }

    PreviewBuffer.clear();

    // TODO: opcjonalnie ustawić sesję w stanie COLLECTING_DATA

    return "PreviewBuffer został zresetowany. Możesz kontynuować dodawanie danych.";
  }
}