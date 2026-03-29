// src/system/moderator/moderatorButtons/absenceMenu.ts

import { Interaction } from "discord.js";
import { renderAbsencePanel } from "../../absencePanel/absencePanel";
import { log } from "../../../core/logger/log";
import { TraceContext } from "../../../core/trace/TraceContext";

export async function handleAbsenceMenu(
  interaction: Interaction,
  ctx: TraceContext
) {
  if (!interaction.isButton()) return;

  const l = log.ctx(ctx);

  const panel = renderAbsencePanel();

  l.event("moderator_absence_menu_open", {
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