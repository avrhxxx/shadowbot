// =====================================
// 📁 src/systems/devpanel/commands/devpanel.command.ts
// =====================================

import {
  ChatInputCommandInteraction,
  CacheType,
} from "discord.js";

import { devpanelMainView } from "../views/devpanel.view";

// =====================================
// 🚀 EXECUTE
// =====================================

export async function handleDevpanelCommand(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const view = await devpanelMainView();

  await interaction.reply({
    content: view.content,
    components: view.components,
    ephemeral: true,
  });
}