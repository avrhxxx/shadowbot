// src/eventsPanel/eventsButtons/eventsCreateSubmit.ts
import { ModalSubmitInteraction, EmbedBuilder } from "discord.js";
import { EventObject, getEvents, saveEvents } from "../eventService";

export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
  const guildId = interaction.guildId!;
  const name = interaction.fields.getTextInputValue("event_name");
  let day = parseInt(interaction.fields.getTextInputValue("event_day"), 10);
  let month = parseInt(interaction.fields.getTextInputValue("event_month"), 10);
  const time = interaction.fields.getTextInputValue("event_time"); // HH:MM
  const reminderBefore = parseInt(interaction.fields.getTextInputValue("reminder_before"), 10);

  const [hour, minute] = time.split(":").map(n => parseInt(n, 10));

  if (!name || isNaN(day) || isNaN(month) || isNaN(hour) || isNaN(minute) || isNaN(reminderBefore)) {
    await interaction.reply({ content: "Invalid input.", ephemeral: true });
    return;
  }

  // Konwertujemy dzień i miesiąc na format dwucyfrowy
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const dayStr = pad(day);
  const monthStr = pad(month);
  const yearStr = new Date().getFullYear(); // bieżący rok

  const events: EventObject[] = await getEvents(guildId);

  const newEvent: EventObject = {
    id: `${Date.now()}`,
    guildId,
    name,
    day,
    month,
    hour,
    minute,
    reminderBefore,
    status: "ACTIVE",
    participants: [],
    createdAt: Date.now()
  };

  events.push(newEvent);
  await saveEvents(guildId, events);

  const embed = new EmbedBuilder()
    .setTitle("Event Created")
    .setDescription(`Event **${name}** scheduled for ${dayStr}/${monthStr}/${yearStr} at ${pad(hour)}:${pad(minute)}`)
    .setColor("Green");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}