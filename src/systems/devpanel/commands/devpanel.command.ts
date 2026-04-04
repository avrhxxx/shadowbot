// =====================================
// 📁 src/systems/devpanel/commands/devpanel.command.ts
// =====================================

import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { createRootContext } from "@/trace";
import { view as uiView } from "@/ui/api";

// =====================================
// 🔹 COMMAND
// =====================================

export async function handleDevpanelCommand(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  // 🔹 Tworzymy TraceContext dla logowania i UIId
  const ctx = createRootContext({
    source: "discord",
    system: "devpanel",
    userId: interaction.user.id,
    guildId: interaction.guildId ?? undefined,
    channelId: interaction.channelId ?? undefined,
  });

  // 🔹 Pokazujemy widok przy użyciu publicznego UI API
  await uiView.show(ctx, "devpanel.main", undefined, {
    ephemeral: true,
    interaction, // podajemy obiekt interakcji, żeby UI API mogło wysłać reply
  });
}