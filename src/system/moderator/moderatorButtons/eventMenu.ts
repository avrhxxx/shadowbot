// src/system/moderator/moderatorButtons/eventMenu.ts

import { Interaction } from "discord.js";
import { renderEventPanel } from "../../eventsPanel/eventPanel";
import { logger } from "../../../core/logger/log";

export async function handleEventMenu(
  interaction: Interaction,
  traceId: string
) {
  if (!interaction.isButton()) return;

  const panel = renderEventPanel();

  logger.emit({
    scope: "moderator.buttons",
    event: "moderator_event_menu_open",
    traceId,
    context: {
      guildId: interaction.guildId,
      id: interaction.customId,
    },
  });

  await interaction.reply({
    content: panel.content,
    components: panel.components,
    ephemeral: true
  });
}