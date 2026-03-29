// src/system/moderator/moderatorButtons/translateMenu.ts

import { Interaction } from "discord.js";
import { logger } from "../../../core/logger/log";

export async function handleTranslateMenu(
  interaction: Interaction,
  traceId: string
) {
  if (!interaction.isButton()) return;

  logger.emit({
    scope: "moderator.buttons",
    event: "moderator_translate_menu_open",
    traceId,
    context: {
      guildId: interaction.guildId,
      id: interaction.customId,
    },
  });

  await interaction.reply({
    content: "Not implemented yet",
    ephemeral: true
  });
}