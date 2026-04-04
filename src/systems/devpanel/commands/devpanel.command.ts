// =====================================
// 📁 src/systems/devpanel/commands/devpanel.command.ts
// =====================================

import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { devpanelMainView } from "../views/devpanel.view";
import { renderView } from "@/core/ui/uiEngine";

// =====================================
// 🚀 EXECUTE
// =====================================

export async function handleDevpanelCommand(interaction: ChatInputCommandInteraction<CacheType>) {
  const view = await renderView(interaction, devpanelMainView.id);
  await interaction.reply({
    content: view.content,
    components: view.buttons,
    ephemeral: true,
  });
}