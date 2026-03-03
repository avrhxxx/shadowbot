import { Interaction } from "discord.js";
import { handleCreate } from "./eventButtons/create";
import { handleList } from "./eventButtons/list";
import { handleCancel } from "./eventButtons/cancel";
import { handleManualReminder } from "./eventButtons/manualReminder";
import { handleDownload } from "./eventButtons/download";
import { handleSettings } from "./eventButtons/settings";
import { handleHelp } from "./eventButtons/help";

export async function handleEventInteraction(interaction: Interaction) {
  if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isStringSelectMenu()) return;
  const { customId } = interaction;
  if (!customId.startsWith("event_")) return;

  switch (customId) {
    case "event_create": return handleCreate(interaction);
    case "event_list": return handleList(interaction);
    case "event_cancel": return handleCancel(interaction);
    case "event_manual_reminder": return handleManualReminder(interaction);
    case "event_download": return handleDownload(interaction);
    case "event_settings": return handleSettings(interaction);
    case "event_help": return handleHelp(interaction);
  }
}