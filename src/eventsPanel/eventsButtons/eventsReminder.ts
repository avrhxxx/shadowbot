import { ButtonInteraction, EmbedBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";

export async function handleManualReminder(interaction: ButtonInteraction) {
  const events = await EventStorage.getEvents(interaction.guildId!);
  const activeEvents = events.filter(e => e.status === "ACTIVE");
  const config = await EventStorage.getConfig(interaction.guildId!);

  if (!config.defaultChannelId) {
    await interaction.reply({ content: "Global channel not set.", ephemeral: true });
    return;
  }

  for (const event of activeEvents) {
    const embed = new EmbedBuilder()
      .setTitle(`Reminder: ${event.name}`)
      .setDescription(`Event starts on ${event.day}/${event.month} at ${event.hour}:${event.minute}`);

    const channel = interaction.guild!.channels.cache.get(config.defaultChannelId);
    if (channel?.isTextBased()) await channel.send({ embeds: [embed] });
  }

  await interaction.reply({ content: "Manual reminders sent.", ephemeral: true });
}