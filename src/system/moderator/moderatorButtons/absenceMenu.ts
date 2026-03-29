// src/system/moderator/moderatorButtons/absenceMenu.ts

import { Interaction } from "discord.js";
import { renderAbsencePanel } from "../../absencePanel/absencePanel";
import { logger } from "../../../core/logger/log";

export async function handleAbsenceMenu(
  interaction: Interaction,
  traceId: string
) {
  if (!interaction.isButton()) return;

  const panel = renderAbsencePanel();

  logger.emit({
    scope: "moderator.buttons",
    event: "moderator_absence_menu_open",
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