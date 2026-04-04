// =====================================
// 📁 src/systems/moderator/commands/moderator.command.ts
// =====================================

import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { renderView } from "@/ui/core/uiEngine";
import { moderatorHubView } from "../views/moderator.view";
import { nanoid } from "nanoid";

// 🔹 Minimalny TraceContext placeholder
const createMinimalTraceContext = () => ({
  traceId: nanoid(),
  correlationId: nanoid(),
  source: "moderator.command",
});

export async function handleModeratorCommand(interaction: ChatInputCommandInteraction<CacheType>) {
  // Render głównego widoku moderatora
  const view = await renderView(createMinimalTraceContext(), moderatorHubView.id);

  // Wyślij odpowiedź ephemeral
  await interaction.reply({
    content: view.content,
    components: view.components,
    ephemeral: true,
  });
}