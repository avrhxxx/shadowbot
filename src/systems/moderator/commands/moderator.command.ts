// =====================================
// 📁 src/systems/moderator/commands/moderator.command.ts
// =====================================

import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { renderView } from "@/core/ui/uiEngine";
import { moderatorHubView } from "../views/moderator.view";

export async function handleModeratorCommand(interaction: ChatInputCommandInteraction<CacheType>) {
  const view = await renderView(interaction, moderatorHubView.id);
  await interaction.reply({
    content: view.content,
    components: view.buttons,
    ephemeral: true,
  });
}