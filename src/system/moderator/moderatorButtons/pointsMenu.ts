// src/system/moderator/moderatorButtons/pointsMenu.ts

import { Interaction } from "discord.js";
import { renderPointsPanel } from "../../pointsPanel/pointsPanel";
import { log } from "../../../core/logger/log";
import { TraceContext } from "../../../core/trace/TraceContext";

export async function handlePointsMenu(
  interaction: Interaction,
  ctx: TraceContext
) {
  if (!interaction.isButton()) return;

  const l = log.ctx(ctx);

  const panel = renderPointsPanel();

  l.event("moderator_points_menu_open", {
    guildId: interaction.guildId,
    id: interaction.customId,
  });

  await interaction.reply({
    content: panel.content,
    components: panel.components,
    ephemeral: true
  });
}