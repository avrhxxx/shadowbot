// =====================================
// 📁 src/systems/events/main/event.main.command.ts
// =====================================

import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { eventMainView } from "./event.main.view";

export async function handleEventMainCommand(interaction: ChatInputCommandInteraction<CacheType>) {
  const view = await eventMainView();
  await interaction.reply({
    content: view.content,
    components: view.components,
    ephemeral: true,
  });
}