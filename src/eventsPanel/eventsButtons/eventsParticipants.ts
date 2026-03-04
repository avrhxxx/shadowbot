// src/eventsPanel/eventsButtons/eventsParticipants.ts
import { 
  ButtonInteraction, 
  ModalSubmitInteraction, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
} from "discord.js";
import * as EventStorage from "../eventStorage";
import { EventObject } from "../eventService";

/**
 * Upewnij się, że EventObject ma pole absent
 */
interface EventObjectWithAbsent extends EventObject {
  absent: string[];
}

/* ======================================================
   🔹 ADD PARTICIPANT (BUTTON → MODAL)
====================================================== */
export async function handleAddParticipant(interaction: ButtonInteraction, eventId: string) {
  const modal = new ModalBuilder()
    .setCustomId(`event_add_modal_${eventId}`)
    .setTitle("Add Participant(s)");

  const input = new TextInputBuilder()
    .setCustomId("user_input")
    .setLabel("Enter game nickname(s), separated by commas")
    .setPlaceholder("e.g. Arek, Allie, DomSugarDaddy...")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
  await interaction.showModal(modal);
}

/* ======================================================
   🔹 ADD PARTICIPANT (MODAL SUBMIT)
====================================================== */
export async function handleAddParticipantSubmit(interaction: ModalSubmitInteraction, eventId: string) {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId!;
  const input = interaction.fields.getTextInputValue("user_input");

  const events = await EventStorage.getEvents(guildId) as EventObjectWithAbsent[];
  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.editReply({ content: "Event not found." });
    return;
  }

  event.absent = event.absent || [];
  const nicknames = input.split(",").map(n => n.trim()).filter(Boolean);
  const added: string[] = [];

  for (const nick of nicknames) {
    if (!event.participants.includes(nick)) {
      event.participants.push(nick);
      added.push(nick);
    }
    // Usuń z absent jeśli wraca do participants
    event.absent = event.absent.filter(n => n !== nick);
  }

  await EventStorage.saveEvents(guildId, events);

  await interaction.editReply({
    content: added.length
      ? `${added.join(", ")} added to **${event.name}**`
      : `No new participants were added (all already present).`
  });
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
    .setLabel("Enter game nickname")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
  await interaction.showModal(modal);
}

/* ======================================================
   🔹 REMOVE PARTICIPANT (MODAL SUBMIT)
====================================================== */
export async function handleRemoveParticipantSubmit(interaction: ModalSubmitInteraction, eventId: string) {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId!;
  const input = interaction.fields.getTextInputValue("user_input");

  const events = await EventStorage.getEvents(guildId) as EventObjectWithAbsent[];
  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.editReply({ content: "Event not found." });
    return;
  }

  if (!event.participants.includes(input)) {
    await interaction.editReply({ content: `${input} is not a participant in **${event.name}**` });
    return;
  }

  // Usuń z participants i absent (jeśli był)
  event.participants = event.participants.filter(nick => nick !== input);
  event.absent = (event.absent || []).filter(n => n !== input);

  await EventStorage.saveEvents(guildId, events);

  await interaction.editReply({ content: `${input} removed from **${event.name}**` });
}

/* ======================================================
   🔹 ABSENT PARTICIPANT (BUTTON → MODAL)
====================================================== */
export async function handleAbsentParticipant(interaction: ButtonInteraction, eventId: string) {
  const modal = new ModalBuilder()
    .setCustomId(`event_absent_modal_${eventId}`)
    .setTitle("Mark Absent");

  const input = new TextInputBuilder()
    .setCustomId("user_input")
    .setLabel("Enter game nickname")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
  await interaction.showModal(modal);
}

/* ======================================================
   🔹 ABSENT PARTICIPANT (MODAL SUBMIT)
====================================================== */
export async function handleAbsentParticipantSubmit(interaction: ModalSubmitInteraction, eventId: string) {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId!;
  const input = interaction.fields.getTextInputValue("user_input");

  const events = await EventStorage.getEvents(guildId) as EventObjectWithAbsent[];
  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.editReply({ content: "Event not found." });
    return;
  }

  event.absent = event.absent || [];

  // Dodaj do absent tylko jeśli jest w participants
  if (!event.participants.includes(input)) {
    await interaction.editReply({ content: `${input} is not a participant in **${event.name}**, cannot mark absent.` });
    return;
  }

  // Przenieś z participants do absent
  event.participants = event.participants.filter(nick => nick !== input);
  if (!event.absent.includes(input)) event.absent.push(input);

  await EventStorage.saveEvents(guildId, events);

  await interaction.editReply({ content: `${input} marked as absent for **${event.name}**` });
}