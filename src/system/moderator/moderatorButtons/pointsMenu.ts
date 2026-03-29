// src/system/moderator/moderatorButtons/pointsMenu.ts

import { Interaction } from "discord.js";
import { renderPointsPanel } from "../../pointsPanel/pointsPanel";
import { logger } from "../../../core/logger/log";

export async function handlePointsMenu(
  interaction: Interaction,
  traceId: string
) {
  if (!interaction.isButton()) return;

  const panel = renderPointsPanel();

  logger.emit({
    scope: "moderator.buttons",
    event: "moderator_points_menu_open",
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