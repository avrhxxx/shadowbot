// src/system/moderator/moderatorButtons/translateMenu.ts

import { Interaction } from "discord.js";
import { log } from "../../../core/logger/log";
import { TraceContext } from "../../../core/trace/TraceContext";

export async function handleTranslateMenu(
  interaction: Interaction,
  ctx: TraceContext
) {
  if (!interaction.isButton()) return;

  const l = log.ctx(ctx);

  l.event("moderator_translate_menu_open", {
    guildId: interaction.guildId,
    id: interaction.customId,
  });

  await interaction.reply({
    content: "Not implemented yet",
    ephemeral: true
  });
}