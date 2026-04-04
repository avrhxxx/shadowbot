import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { devpanelMainView } from "../views/devpanel.view";
import { renderView } from "@/ui/core/uiEngine";
import { nanoid } from "nanoid";

// Minimalny placeholder TraceContext
const minimalTraceContext = {
  traceId: nanoid(),
  correlationId: nanoid(),
  source: "devpanel.command",
};

export async function handleDevpanelCommand(interaction: ChatInputCommandInteraction<CacheType>) {
  const view = await renderView(minimalTraceContext, devpanelMainView.id);

  await interaction.reply({
    content: view.content,
    components: view.components,
    ephemeral: true,
  });
}