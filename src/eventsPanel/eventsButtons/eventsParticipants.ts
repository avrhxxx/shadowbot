// src/eventsPanel/eventsButtons/eventsParticipants.ts
import { ModalSubmitInteraction, EmbedBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";

// Dodaje użytkownika do listy uczestników po wprowadzeniu w modalu
export async function handleAddParticipantSubmit(
  interaction: ModalSubmitInteraction,
  eventId: string
) {
  const guildId = interaction.guildId!;
  const userId = interaction.fields.getTextInputValue("participant_id");

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  if (!event.participants) event.participants = [];
  if (event.participants.includes(userId)) {
    await interaction.reply({ content: "User already participating.", ephemeral: true });
    return;
  }

  event.participants.push(userId);
  await EventStorage.saveEvents(guildId, events);

  const embed = new EmbedBuilder()
    .setTitle(`Added to Event: ${event.name}`)
    .setDescription(`<@${userId}> has been added as participant.`)
    .setColor("Green");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Usuwa użytkownika
export async function handleRemoveParticipant(interaction: ModalSubmitInteraction, eventId: string) {
  const guildId = interaction.guildId!;
  const userId = interaction.fields.getTextInputValue("participant_id");

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  if (!event.participants.includes(userId)) {
    await interaction.reply({ content: "User is not participating.", ephemeral: true });
    return;
  }

  event.participants = event.participants.filter(id => id !== userId);
  await EventStorage.saveEvents(guildId, events);

  const embed = new EmbedBuilder()
    .setTitle(`Removed from Event: ${event.name}`)
    .setDescription(`<@${userId}> has been removed.`)
    .setColor("Red");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Oznacza użytkownika jako absent
export async function handleAbsentParticipant(interaction: ModalSubmitInteraction, eventId: string) {
  const guildId = interaction.guildId!;
  const userId = interaction.fields.getTextInputValue("participant_id");

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  if (!event.participants.includes(userId)) {
    await interaction.reply({ content: "User is not participating.", ephemeral: true });
    return;
  }

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