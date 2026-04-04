// =====================================
// 📁 src/systems/events/main/event.main.command.ts
// =====================================

import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { renderView } from "@/ui/core/uiEngine";
import { eventMainPanel } from "./event.main.view";

export async function handleEventMainCommand(interaction: ChatInputCommandInteraction<CacheType>) {
  const view = await renderView(interaction, eventMainPanel.id);
  await interaction.reply({
    content: view.content,
    components: view.components,
    ephemeral: true,
  });
}
