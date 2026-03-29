// src/eventsPanel/eventsButtons/eventsParticipants.ts
import { 
  ButtonInteraction, 
  ModalSubmitInteraction, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
} from "discord.js";

import { getEventById, updateEvent, EventObject } from "../eventService";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { logger } from "../../../core/logger/log";

// ==========================
// HELPERS
// ==========================
async function showTextModal(
  interaction: ButtonInteraction,
  title: string,
  customId: string,
  placeholder?: string
) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title);

  const input = new TextInputBuilder()
    .setCustomId("user_input")
    .setLabel(title)
    .setPlaceholder(placeholder ?? "")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(input)
  );

  await interaction.showModal(modal);
}

// ==========================
// MODAL SHOW HANDLERS
// ==========================
export async function handleAddParticipant(
  interaction: ButtonInteraction,
  eventId: string
) {
  await showTextModal(
    interaction,
    "Add Participant(s)",
    `event_add_modal_${eventId}`,
    "e.g. Arek, Allie, DomSugarDaddy..."
  );
}

export async function handleRemoveParticipant(
  interaction: ButtonInteraction,
  eventId: string
) {
  await showTextModal(
    interaction,
    "Remove Participant",
    `event_remove_modal_${eventId}`
  );
}

export async function handleAbsentParticipant(
  interaction: ButtonInteraction,
  eventId: string
) {
  await showTextModal(
    interaction,
    "Mark Absent",
    `event_absent_modal_${eventId}`
  );
}

// ==========================
// MODAL SUBMIT HANDLERS
// ==========================
async function updateParticipants(
  interaction: ModalSubmitInteraction,
  eventId: string,
  updater: (event: EventObject, input: string[]) => string[]
) {
  const traceId = createTraceId();

  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId;

  if (!guildId) {
    logger.emit({
      scope: "events.participants",
      event: "missing_guild",
      traceId,
      level: "error",
    });

    await interaction.editReply({ content: "❌ Missing guild." }).catch(() => null);
    return;
  }

  try {
    const inputRaw = interaction.fields.getTextInputValue("user_input");

    const input = inputRaw
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    const event = await getEventById(guildId, eventId);

    if (!event) {
      await interaction.editReply({ content: "Event not found." });
      return;
    }

    const updatedItems = updater(event, input);

    await updateEvent(eventId, {
      participants: event.participants,
      absent: event.absent,
    });

    await interaction.editReply({
      content: updatedItems.length
        ? `${updatedItems.join(", ")} updated for **${event.name}**`
        : `No changes were made for **${event.name}**.`,
    });

    logger.emit({
      scope: "events.participants",
      event: "participants_updated",
      traceId,
      context: {
        guildId,
        eventId,
        updatedCount: updatedItems.length,
        inputCount: input.length,
      },
    });

  } catch (err) {
    logger.emit({
      scope: "events.participants",
      event: "update_failed",
      traceId,
      level: "error",
      context: {
        eventId,
      },
      error: err,
    });

    await interaction.editReply({
      content: "❌ Failed to update participants."
    }).catch(() => null);
  }
}

// ==========================
// HANDLERS
// ==========================
export async function handleAddParticipantSubmit(
  interaction: ModalSubmitInteraction,
  eventId: string
) {
  await updateParticipants(interaction, eventId, (event, nicknames) => {
    const added: string[] = [];

    for (const nick of nicknames) {
      if (!event.participants.includes(nick)) {
        event.participants.push(nick);
        added.push(nick);
      }

      event.absent = event.absent.filter((n) => n !== nick);
    }

    return added;
  });
}

export async function handleRemoveParticipantSubmit(
  interaction: ModalSubmitInteraction,
  eventId: string
) {
  await updateParticipants(interaction, eventId, (event, nicknames) => {
    const removed: string[] = [];

    for (const nick of nicknames) {
      if (event.participants.includes(nick)) {
        event.participants = event.participants.filter(
          (n) => n !== nick
        );

        event.absent = event.absent.filter(
          (n) => n !== nick
        );

        removed.push(nick);
      }
    }

    return removed;
  });
}

export async function handleAbsentParticipantSubmit(
  interaction: ModalSubmitInteraction,
  eventId: string
) {
  await updateParticipants(interaction, eventId, (event, nicknames) => {
    const marked: string[] = [];

    for (const nick of nicknames) {
      if (!event.participants.includes(nick)) continue;

      event.participants = event.participants.filter(
        (n) => n !== nick
      );

      if (!event.absent.includes(nick)) {
        event.absent.push(nick);
      }

      marked.push(nick);
    }

    return marked;
  });
}