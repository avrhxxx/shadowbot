// src/system/moderator/moderatorButtons/eventMenu.ts

import { Interaction } from "discord.js";
import { renderEventPanel } from "../../eventsPanel/eventPanel";
import { log } from "../../../core/logger/log";
import { TraceContext } from "../../../core/trace/TraceContext";

export async function handleEventMenu(
  interaction: Interaction,
  ctx: TraceContext
) {
  if (!interaction.isButton()) return;

  const l = log.ctx(ctx);

  const panel = renderEventPanel();

  l.event("moderator_event_menu_open", {
    guildId: interaction.guildId,
    id: interaction.customId,
  });

  await interaction.reply({
    content: panel.content,
    components: panel.components,
    ephemeral: true
  });
}