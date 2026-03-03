// src/eventsPanel/eventsButtons/eventsCreateSubmit.ts
import { ModalSubmitInteraction, EmbedBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";

// Definicja typu EventObject
interface EventObject {
  id: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  reminderBefore: number;
  status: "ACTIVE" | "PAST" | "CANCELLED";
  participants: string[];
  createdAt: number;
  guildId: string;
}

export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
  const guildId = interaction.guildId!;
  const name = interaction.fields.getTextInputValue("event_name");
  const day = parseInt(interaction.fields.getTextInputValue("event_day"), 10);
  const month = parseInt(interaction.fields.getTextInputValue("event_month"), 10);
  const time = interaction.fields.getTextInputValue("event_time"); // HH:MM
  const reminderBefore = parseInt(interaction.fields.getTextInputValue("reminder_before"), 10);

  // Walidacja
  const [hour, minute] = time.split(":").map(n => parseInt(n, 10));
  if (!name || isNaN(day) || isNaN(month) || isNaN(hour) || isNaN(minute) || isNaN(reminderBefore)) {
    await interaction.reply({ content: "Invalid input.", ephemeral: true });
    return;
  }

  const events: EventObject[] = await EventStorage.getEvents(guildId);

  const newEvent: EventObject = {
    id: `${Date.now()}`, // prosty unikalny id
    name,
    day,
    month,
    hour,
    minute,
    reminderBefore,
    status: "ACTIVE", // literal zgodny z typem
    participants: [],
    createdAt: Date.now(),
    guildId
  };

  events.push(newEvent);
  await EventStorage.saveEvents(guildId, events);

  const embed = new EmbedBuilder()
    .setTitle("Event Created")
    .setDescription(`Event **${name}** scheduled for ${day}/${month} at ${hour}:${minute}`)
    .setColor("Green");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}