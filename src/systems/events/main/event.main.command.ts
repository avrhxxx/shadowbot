// =====================================
// 📁 src/systems/events/main/event.main.command.ts
// =====================================

import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { renderView } from "@/ui/core/uiEngine";
import { eventMainPanel } from "./event.main.view";
import { nanoid } from "nanoid";

// 🔹 Minimalny TraceContext placeholder
const createMinimalTraceContext = () => ({
  traceId: nanoid(),
  correlationId: nanoid(),
  source: "events.main.command",
});

export async function handleEventMainCommand(interaction: ChatInputCommandInteraction<CacheType>) {
  const view = await renderView(createMinimalTraceContext(), eventMainPanel.id);

  await interaction.reply({
    content: view.content,
    components: view.components,
    ephemeral: true,
  });
}