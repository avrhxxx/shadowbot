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
    .setLabel("Enter game nickname") // Zmienione na game nickname
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
  const guildId = interaction.guildId!;
  const input = interaction.fields.getTextInputValue("user_input");

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  if (!event.participants.includes(input)) {
    event.participants.push(input);
    await EventStorage.saveEvents(guildId, events);
  }

  const embed = new EmbedBuilder()
    .setTitle(`Participant Added`)
    .setDescription(`${input} added to **${event.name}**`)
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
    .setLabel("Enter game nickname") // Zmienione na game nickname
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
  const guildId = interaction.guildId!;
  const input = interaction.fields.getTextInputValue("user_input");

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  event.participants = event.participants.filter(nick => nick !== input);
  await EventStorage.saveEvents(guildId, events);

  const embed = new EmbedBuilder()
    .setTitle(`Participant Removed`)
    .setDescription(`${input} removed from **${event.name}**`)
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
    .setLabel("Enter game nickname") // Zmienione na game nickname
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
  const guildId = interaction.guildId!;
  const input = interaction.fields.getTextInputValue("user_input");

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  event.participants = event.participants.filter(nick => nick !== input);
  if (!("absent" in event)) (event as any).absent = [];
  (event as any).absent.push(input);

  await EventStorage.saveEvents(guildId, events);

  const embed = new EmbedBuilder()
    .setTitle(`Participant Marked Absent`)
    .setDescription(`${input} marked absent for **${event.name}**`)
    .setColor("Orange");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}