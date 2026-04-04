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
  // używamy pustego kontekstu, bo interaction nie jest TraceContext
  const view = await renderView({}, devpanelMainView.id);

  await interaction.reply({
    content: view.content,
    components: view.components, // poprawka z buttons -> components
    ephemeral: true,
  });
}