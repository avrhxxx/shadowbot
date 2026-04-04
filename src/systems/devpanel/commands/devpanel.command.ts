// =====================================
// 📁 src/systems/devpanel/commands/devpanel.command.ts
// =====================================

import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { createRootContext } from "@/trace";
import { renderViewInternal } from "@/ui/engine/engine";

// =====================================
// 🔹 COMMAND
// =====================================

export async function handleDevpanelCommand(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const ctx = createRootContext({
    source: "discord",
    system: "devpanel",
    userId: interaction.user.id,
    guildId: interaction.guildId ?? undefined,
    channelId: interaction.channelId ?? undefined,
  });

  const view = await renderViewInternal(ctx, "devpanel.main");

  await interaction.reply({
    content: view.content,
    components: view.components,
    ephemeral: true,
  });
}