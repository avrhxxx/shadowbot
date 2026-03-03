// src/eventsPanel/eventsButtons/eventsParticipants.ts
import { 
  ButtonInteraction, 
  ModalSubmitInteraction, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  EmbedBuilder 
} from "discord.js";
import * as EventStorage from "../eventStorage";

/* ======================================================
   🔹 ADD PARTICIPANT (BUTTON → MODAL)
====================================================== */
export async function handleAddParticipant(interaction: ButtonInteraction, eventId: string) {
  const modal = new ModalBuilder()
    .setCustomId(`event_add_modal_${eventId}`)
    .setTitle("Add Participant");

  const input = new TextInputBuilder()
    .setCustomId("user_input")
    .setLabel("Enter user mention, ID or username")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
  modal.addComponents(row);
  await interaction.showModal(modal);
}

/* ======================================================
   🔹 ADD PARTICIPANT (MODAL SUBMIT)
====================================================== */
export async function handleAddParticipantSubmit(interaction: ModalSubmitInteraction, eventId: string) {
  const guild = interaction.guild!;
  const guildId = guild.id;
  const input = interaction.fields.getTextInputValue("user_input");

  const member =
    guild.members.cache.get(input.replace(/[<@!>]/g, "")) ||
    guild.members.cache.find(m => m.user.username.toLowerCase() === input.toLowerCase());

  // ✅ Usuwamy walidację "User not found" – dodajemy nawet jeśli nie znaleziono w cache

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  if (member && !event.participants.includes(member.id)) {
    event.participants.push(member.id);
    await EventStorage.saveEvents(guildId, events);
  }

  const embed = new EmbedBuilder()
    .setTitle(`Participant Added`)
    .setDescription(member ? `${member} added to **${event.name}**` : `User added to **${event.name}**`)
    .setColor("Green");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/* ======================================================
   🔹 REMOVE PARTICIPANT (BUTTON → MODAL)
====================================================== */
export async function handleRemoveParticipant(interaction: ButtonInteraction, eventId: string) {
  const modal = new ModalBuilder()
    .setCustomId(`event_remove_modal_${eventId}`)
    .setTitle("Remove Participant");

  const input = new TextInputBuilder()
    .setCustomId("user_input")
    .setLabel("Enter user mention, ID or username")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
  modal.addComponents(row);
  await interaction.showModal(modal);
}

/* ======================================================
   🔹 REMOVE PARTICIPANT (MODAL SUBMIT)
====================================================== */
export async function handleRemoveParticipantSubmit(interaction: ModalSubmitInteraction, eventId: string) {
  const guild = interaction.guild!;
  const guildId = guild.id;
  const input = interaction.fields.getTextInputValue("user_input");

  const member =
    guild.members.cache.get(input.replace(/[<@!>]/g, "")) ||
    guild.members.cache.find(m => m.user.username.toLowerCase() === input.toLowerCase());

  if (!member) {
    await interaction.reply({ content: "User not found.", ephemeral: true });
    return;
  }

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  event.participants = event.participants.filter(id => id !== member.id);
  await EventStorage.saveEvents(guildId, events);

  const embed = new EmbedBuilder()
    .setTitle(`Participant Removed`)
    .setDescription(`${member} removed from **${event.name}**`)
    .setColor("Red");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/* ======================================================
   🔹 ABSENT PARTICIPANT (BUTTON → MODAL)
====================================================== */
export async function handleAbsentParticipant(interaction: ButtonInteraction, eventId: string) {
  const modal = new ModalBuilder()
    .setCustomId(`event_absent_modal_${eventId}`)
    .setTitle("Mark Participant Absent");

  const input = new TextInputBuilder()
    .setCustomId("user_input")
    .setLabel("Enter user mention, ID or username")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
  modal.addComponents(row);
  await interaction.showModal(modal);
}

/* ======================================================
   🔹 ABSENT PARTICIPANT (MODAL SUBMIT)
====================================================== */
export async function handleAbsentParticipantSubmit(interaction: ModalSubmitInteraction, eventId: string) {
  const guild = interaction.guild!;
  const guildId = guild.id;
  const input = interaction.fields.getTextInputValue("user_input");

  const member =
    guild.members.cache.get(input.replace(/[<@!>]/g, "")) ||
    guild.members.cache.find(m => m.user.username.toLowerCase() === input.toLowerCase());

  if (!member) {
    await interaction.reply({ content: "User not found.", ephemeral: true });
    return;
  }

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  event.participants = event.participants.filter(id => id !== member.id);
  if (!("absent" in event)) (event as any).absent = [];
  (event as any).absent.push(member.id);

  await EventStorage.saveEvents(guildId, events);

  const embed = new EmbedBuilder()
    .setTitle(`Participant Marked Absent`)
    .setDescription(`${member} marked absent for **${event.name}**`)
    .setColor("Orange");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}