// events/EventService.ts

import { Interaction, EmbedBuilder } from "discord.js";
import * as EventStorage from "./EventStorage";

export async function handleCreate(interaction: Interaction) {
  if (!interaction.isButton()) return;

  // TODO: pokaż modal
}

export async function handleList(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const events = await EventStorage.getEvents(interaction.guildId!);

  const embed = new EmbedBuilder()
    .setTitle("Event List")
    .setDescription("Lista eventów...");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function handleCancel(interaction: Interaction) {
  if (!interaction.isButton()) return;

  // TODO: select menu + zmiana statusu
}

export async function handleManualReminder(interaction: Interaction) {
  if (!interaction.isButton()) return;

  // TODO: pobierz ACTIVE eventy i wyślij przypomnienie
}

export async function handleDownload(interaction: Interaction) {
  if (!interaction.isButton()) return;

  // TODO: wygeneruj plik i wyślij
}

export async function handleSettings(interaction: Interaction) {
  if (!interaction.isButton()) return;

  // TODO: channel select + zapis config
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