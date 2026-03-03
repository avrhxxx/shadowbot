// src/eventsPanel/eventsButtons/eventsParticipants.ts
import { ButtonInteraction, EmbedBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";

// Dodaje użytkownika do listy uczestników
export async function handleAddParticipant(
  interaction: ButtonInteraction,
  eventId: string
) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);

  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  if (event.participants.includes(userId)) {
    await interaction.reply({ content: "You are already a participant.", ephemeral: true });
    return;
  }

  event.participants.push(userId);
  await EventStorage.saveEvents(guildId, events);

  const embed = new EmbedBuilder()
    .setTitle(`Added to Event: ${event.name}`)
    .setDescription(`<@${userId}> is now participating.`)
    .setColor("Green");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Usuwa użytkownika z listy uczestników
export async function handleRemoveParticipant(
  interaction: ButtonInteraction,
  eventId: string
) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);

  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  if (!event.participants.includes(userId)) {
    await interaction.reply({ content: "You are not a participant.", ephemeral: true });
    return;
  }

  event.participants = event.participants.filter(id => id !== userId);
  await EventStorage.saveEvents(guildId, events);

  const embed = new EmbedBuilder()
    .setTitle(`Removed from Event: ${event.name}`)
    .setDescription(`<@${userId}> has been removed from participants.`)
    .setColor("Red");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Oznacza użytkownika jako nieobecnego (absent)
export async function handleAbsentParticipant(
  interaction: ButtonInteraction,
  eventId: string
) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);

  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  if (!event.participants.includes(userId)) {
    await interaction.reply({ content: "You are not a participant.", ephemeral: true });
    return;
  }

  // Usuń z uczestników i dodaj do absent (opcjonalnie, jeśli chcesz trackować absent separately)
  event.participants = event.participants.filter(id => id !== userId);
  if (!("absent" in event)) (event as any).absent = [];
  (event as any).absent.push(userId);

  await EventStorage.saveEvents(guildId, events);

  const embed = new EmbedBuilder()
    .setTitle(`Marked Absent: ${event.name}`)
    .setDescription(`<@${userId}> is now marked as absent.`)
    .setColor("Orange");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}