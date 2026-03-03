// src/eventsPanel/eventsButtons/eventsCreateSubmit.ts
import { ModalSubmitInteraction, EmbedBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";
import { EventObject } from "../eventService";

// Pomocnicza funkcja do formatowania daty
function formatDate(day: number, month: number, year: number): string {
  const dd = day < 10 ? `0${day}` : `${day}`;
  const mm = month < 10 ? `0${month}` : `${month}`;
  return `${dd}/${mm}/${year}`;
}

export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== "event_create_modal") return;

  const guildId = interaction.guildId!;
  const name = interaction.fields.getTextInputValue("event_name");
  const dayInput = interaction.fields.getTextInputValue("event_day");
  const monthInput = interaction.fields.getTextInputValue("event_month");
  const time = interaction.fields.getTextInputValue("event_time");
  const reminderInput = interaction.fields.getTextInputValue("reminder_before");

  const day = parseInt(dayInput, 10);
  const month = parseInt(monthInput, 10);
  const year = new Date().getFullYear();

  if (isNaN(day) || day < 1 || day > 31) {
    await interaction.reply({ content: "Invalid day.", ephemeral: true });
    return;
  }
  if (isNaN(month) || month < 1 || month > 12) {
    await interaction.reply({ content: "Invalid month.", ephemeral: true });
    return;
  }

  const formattedDate = formatDate(day, month, year);

  // Tworzymy nowy event
  const newEvent: EventObject = {
    id: `${Date.now()}`, // unikalne ID na podstawie timestampu
    name,
    date: formattedDate,
    time,
    reminderBefore: parseInt(reminderInput, 10) || 0,
    participants: [],
    status: "ACTIVE"
  };

  // Pobieramy istniejące eventy i dodajemy nowy
  const events = await EventStorage.getEvents(guildId);
  events.push(newEvent);
  await EventStorage.saveEvents(guildId, events);

  const embed = new EmbedBuilder()
    .setTitle("Event Created")
    .setDescription(`**${name}** scheduled on **${formattedDate}** at **${time}**.`)
    .setColor("Blue");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}