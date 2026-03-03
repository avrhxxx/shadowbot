import { Interaction, EmbedBuilder } from "discord.js";
import * as EventStorage from "./eventStorage";

// Logika biznesowa Event Panelu

export async function handleCreate(interaction: Interaction) {
  if (!interaction.isButton()) return;
  await interaction.reply({ content: "Create event – TODO", ephemeral: true });
}

export async function handleList(interaction: Interaction) {
  if (!interaction.isButton()) return;
  const events = await EventStorage.getEvents(interaction.guildId!);
  const embed = new EmbedBuilder()
    .setTitle("Event List")
    .setDescription(
      events.length === 0
        ? "No events found."
        : events.map((e: any) => `• ${e.name} (${e.status})`).join("\n")
    );
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function handleCancel(interaction: Interaction) {
  if (!interaction.isButton()) return;
  await interaction.reply({ content: "Cancel event – TODO", ephemeral: true });
}

export async function handleManualReminder(interaction: Interaction) {
  if (!interaction.isButton()) return;
  await interaction.reply({ content: "Manual reminder – TODO", ephemeral: true });
}

export async function handleDownload(interaction: Interaction) {
  if (!interaction.isButton()) return;
  await interaction.reply({ content: "Download participants – TODO", ephemeral: true });
}

export async function handleSettings(interaction: Interaction) {
  if (!interaction.isButton()) return;
  await interaction.reply({ content: "Settings – TODO", ephemeral: true });
}

export async function handleHelp(interaction: Interaction) {
  if (!interaction.isButton()) return;
  const embed = new EmbedBuilder()
    .setTitle("Event Help")
    .setDescription(`
🟢 Create – tworzy event  
📄 List – lista eventów  
🗑️ Cancel – anulowanie  
🔔 Reminder – przypomnienie  
⬇️ Download – uczestnicy  
⚙️ Settings – kanał globalny
`);
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
