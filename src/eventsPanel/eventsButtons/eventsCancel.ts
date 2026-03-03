
import { Interaction, StringSelectMenuBuilder, ActionRowBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";

export async function handleCancel(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const events = await EventStorage.getEvents(interaction.guildId!);
  const activeEvents = events.filter(e => e.status === "ACTIVE");

  if (!activeEvents.length) {
    await interaction.reply({ content: "No active events to cancel.", ephemeral: true });
    return;
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("event_cancel_select")
    .setPlaceholder("Select an event to cancel")
    .addOptions(
      activeEvents.map(e => ({ label: e.name, value: e.id }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await interaction.reply({ content: "Select event to cancel:", components: [row], ephemeral: true });
}