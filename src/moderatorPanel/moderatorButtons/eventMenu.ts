// src/moderatorPanel/moderatorButtons/eventMenu.ts
import { Interaction } from "discord.js";
import { renderEventPanel } from "../../eventsPanel/eventPanel";

export async function handleEventMenu(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const panel = renderEventPanel();

  await interaction.reply({
    content: panel.content,
    components: panel.components,
    ephemeral: true
  });
}
