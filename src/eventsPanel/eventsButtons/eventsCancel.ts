import { 
  ButtonInteraction, 
  StringSelectMenuBuilder, 
  ActionRowBuilder 
} from "discord.js";
import * as EventStorage from "../eventStorage";

export async function handleCancel(interaction: ButtonInteraction) {
  if (!interaction.isButton()) return;

  const guildId = interaction.guildId;
  if (!guildId) return;

  const events = await EventStorage.getEvents(guildId);
  const activeEvents = events.filter(e => e.status === "ACTIVE");

  if (activeEvents.length === 0) {
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