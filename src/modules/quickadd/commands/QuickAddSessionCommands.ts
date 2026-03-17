import { Message } from "discord.js";
import { SessionManager } from "../sessions/SessionManager";

/**
 * Placeholder dla sesyjnych komend QuickAdd
 * np. !preview, !adjust, !repair, !redo, !confirm, !cancel
 */
export async function previewCommand(message: Message) {
  const session = SessionManager.getSession();
  if (!session) {
    await message.reply("⚠️ Brak aktywnej sesji QuickAdd.");
    return;
  }

  await message.reply("Preview buffer: (placeholder)"); // Później podłączymy PreviewBuffer
}

export async function adjustCommand(message: Message, args: string[]) {
  const session = SessionManager.getSession();
  if (!session) {
    await message.reply("⚠️ Brak aktywnej sesji QuickAdd.");
    return;
  }

  await message.reply("Adjust command placeholder.");
}

export async function repairCommand(message: Message) {
  const session = SessionManager.getSession();
  if (!session) {
    await message.reply("⚠️ Brak aktywnej sesji QuickAdd.");
    return;
  }

  await message.reply("Repair command placeholder.");
}