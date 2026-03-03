import { Interaction } from "discord.js";
import * as EventService from "./eventService";

export async function handleEventInteraction(interaction: Interaction) {
  if (
    !interaction.isButton() &&
    !interaction.isModalSubmit() &&
    !interaction.isStringSelectMenu()
  ) return;

  const { customId } = interaction;

  if (!customId.startsWith("event_")) return;

  switch (customId) {
    case "event_create":
      return EventService.handleCreate(interaction);

    case "event_list":
      return EventService.handleList(interaction);

    case "event_cancel":
      return EventService.handleCancel(interaction);

    case "event_manual_reminder":
      return EventService.handleManualReminder(interaction);

    case "event_download":
      return EventService.handleDownload(interaction);

    case "event_settings":
      return EventService.handleSettings(interaction);

    case "event_help":
      return EventService.handleHelp(interaction);
  }
}