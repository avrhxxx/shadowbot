import { Interaction, StringSelectMenuBuilder, ActionRowBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";

export async function handleSettings(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const channels = interaction.guild!.channels.cache
    .filter(c => c.isTextBased())
    .map(c => ({ label: c.name, value: c.id }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("event_settings_select")
    .setPlaceholder("Select default notification channel") // zmiana placeholder
    .addOptions(channels);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await interaction.reply({ content: "Select notification channel:", components: [row], ephemeral: true });
}

// Handler select menu
export async function handleSettingsSelect(interaction: any) {
  const guildId = interaction.guildId!;
  const channelId = interaction.values[0];

  await EventStorage.saveConfig(guildId, { defaultChannelId: channelId });
  await interaction.reply({ content: `Notification channel set to <#${channelId}>.`, ephemeral: true }); // zmiana odpowiedzi
}