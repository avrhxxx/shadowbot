import { Interaction } from "discord.js";
import { renderAbsencePanel } from "./absencePanel";

export async function handleAbsenceMenu(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const panel = renderAbsencePanel();

  await interaction.reply({
    content: panel.content,
    components: panel.components,
    ephemeral: true
  });
}