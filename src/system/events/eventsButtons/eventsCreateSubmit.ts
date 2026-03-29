// src/eventsPanel/eventsButtons/eventsCreateSubmit.ts
import {
  ModalSubmitInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuInteraction,
  ButtonInteraction
} from "discord.js";
import { v4 as uuidv4 } from "uuid";
import { createEvent, EventObject } from "../eventService";
import { getEventDateUTC, formatEventUTC } from "../../utils/timeUtils";
import { sendEventCreatedNotification } from "./eventsReminder";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { logger } from "../../../core/logger/log";

// -----------------------------------------------------------
// TEMP DATA TYPE
// -----------------------------------------------------------
export type TempEventData = {
  id: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  guildId: string;
  year?: number;
  reminderBefore?: number;
  notifyOnCreate?: boolean;
  eventType: string;
};

// -----------------------------------------------------------
// TEMP STORE
// -----------------------------------------------------------
export const tempEventStore = new Map<string, TempEventData>();

// -----------------------------------------------------------
// HELPERS
// -----------------------------------------------------------
function parseEventDateTime(input: string) {
  const cleaned = input.trim();
  const match = cleaned.match(
    /^(\d{1,2})(?:[.\-/]?)(\d{1,2})\s*(\d{2})(?::?(\d{2}))?$/
  );
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const hour = parseInt(match[3], 10);
  const minute = match[4] ? parseInt(match[4], 10) : 0;
  if (hour > 23 || minute > 59) return null;
  return { day, month, hour, minute };
}

async function safeReply(interaction: any, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  if ("update" in interaction && typeof interaction.update === "function") return interaction.update(payload);
  if (payload.ephemeral) {
    payload.flags = 64;
    delete payload.ephemeral;
  }
  return interaction.reply(payload);
}

// -----------------------------------------------------------
// HANDLE CREATE SUBMIT (ENTRY → dostaje traceId z eventHandlers)
// -----------------------------------------------------------
export async function handleCreateSubmit(
  interaction: ModalSubmitInteraction,
  traceId: string
) {
  const guildId = interaction.guildId!;

  logger.emit({
    scope: "events.create",
    event: "submit_received",
    traceId,
    context: {
      guildId,
      userId: interaction.user.id,
      customId: interaction.customId,
    },
  });

  const typeMatch = interaction.customId.match(/^event_create_modal_(.+)$/);
  const rawType = typeMatch ? typeMatch[1] : "custom";
  const eventType = rawType.startsWith("standard_") ? rawType.replace(/^standard_/, "") : rawType;

  let name = "";
  let datetimeRaw = "";
  let yearRaw: string | undefined;

  try { name = interaction.fields.getTextInputValue("event_name"); } catch {}
  try { datetimeRaw = interaction.fields.getTextInputValue("event_datetime"); } catch {}
  try { yearRaw = interaction.fields.getTextInputValue("event_year"); } catch {}

  const prefillMap: Record<string, string> = {
    arcadian_conquest: "Arcadian Conquest",
    city_contest: "City Contest",
    reservoir_raid: "Reservoir Raid",
    ghoulion_pursuit: "Ghoulion Pursuit",
    kvk: "KvK"
  };
  if (prefillMap[eventType]) name = prefillMap[eventType];

  let day: number, month: number, hour = 0, minute = 0, year: number | undefined;

  if (eventType === "birthdays") {
    const dateMatch = datetimeRaw.trim().match(/^(\d{1,2})[./-]?(\d{1,2})$/);
    if (!dateMatch) {
      logger.emit({
        scope: "events.create",
        event: "invalid_birthdate_format",
        traceId,
        input: { datetimeRaw },
      });

      await safeReply(interaction, { content: "Invalid date format. Use DD/MM.", ephemeral: true });
      return;
    }

    day = parseInt(dateMatch[1], 10);
    month = parseInt(dateMatch[2], 10);
    year = new Date().getUTCFullYear();
    name = `${name}'s birthday! 🎉`;

  } else {
    const parsed = parseEventDateTime(datetimeRaw);

    if (!parsed && eventType !== "custom") {
      logger.emit({
        scope: "events.create",
        event: "invalid_datetime_format",
        traceId,
        input: { datetimeRaw },
      });

      await safeReply(interaction, { content: "Invalid date/time format.", ephemeral: true });
      return;
    }

    day = parsed?.day ?? 1;
    month = parsed?.month ?? 1;
    hour = parsed?.hour ?? 0;
    minute = parsed?.minute ?? 0;

    const yearParsed = yearRaw ? parseInt(yearRaw, 10) : undefined;
    year = Number.isNaN(yearParsed) ? undefined : yearParsed;
  }

  const tempId = `E-${uuidv4()}`;
  const nowUTC = new Date();
  const eventDateUTC = year
    ? new Date(Date.UTC(year, month - 1, day, hour, minute))
    : getEventDateUTC(day, month, hour, minute);

  if ((eventType === "birthdays" || eventType === "custom") && !year && eventDateUTC.getTime() < nowUTC.getTime()) {

    logger.emit({
      scope: "events.create",
      event: "past_date_detected",
      traceId,
      context: { tempId, eventType },
    });

    tempEventStore.set(tempId, { id: tempId, name, day, month, hour, minute, guildId, eventType, notifyOnCreate: false });

    await safeReply(interaction, {
      content: `The date ${formatEventUTC(day, month, hour, minute)} has passed. Schedule for next year?`,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`next_year_yes-${tempId}`).setLabel("Yes").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`next_year_no-${tempId}`).setLabel("No").setStyle(ButtonStyle.Danger)
        )
      ],
      ephemeral: true
    });
    return;
  }

  tempEventStore.set(tempId, {
    id: tempId,
    name,
    day,
    month,
    hour,
    minute,
    guildId,
    year: year ?? eventDateUTC.getUTCFullYear(),
    reminderBefore: eventType === "birthdays" ? 0 : 60,
    eventType,
    notifyOnCreate: eventType === "birthdays" ? false : undefined
  });

  logger.emit({
    scope: "events.create",
    event: "temp_created",
    traceId,
    context: { tempId, eventType },
  });

  if (eventType !== "birthdays") {
    await showCreateNotificationConfirm(interaction, tempId, traceId);
  } else {
    await finalizeEvent(interaction, tempId, traceId);
  }
}

// -----------------------------------------------------------
// INTERNAL (NO NEW TRACE)
// -----------------------------------------------------------
export async function showCreateNotificationConfirm(
  interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction,
  tempId: string,
  traceId: string
) {
  const tempData = tempEventStore.get(tempId);
  if (!tempData) return;

  await safeReply(interaction, {
    content: "Do you want to send a notification about creating this event?",
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`notify_create_yes-${tempId}`).setLabel("Yes").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`notify_create_no-${tempId}`).setLabel("No").setStyle(ButtonStyle.Danger)
      )
    ],
    ephemeral: true
  });

  logger.emit({
    scope: "events.create",
    event: "ask_notification",
    traceId,
    context: { tempId },
  });
}

export async function finalizeEvent(
  interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction,
  tempId: string,
  traceId: string
) {
  const tempData = tempEventStore.get(tempId);

  if (!tempData) {
    logger.emit({
      scope: "events.create",
      event: "temp_missing",
      traceId,
      context: { tempId },
    });

    await safeReply(interaction, { content: "Temporary event data not found.", components: [], ephemeral: true });
    return;
  }

  try {
    const newEvent: EventObject = {
      id: tempData.id,
      guildId: tempData.guildId,
      name: tempData.name,
      day: tempData.day,
      month: tempData.month,
      hour: tempData.hour,
      minute: tempData.minute,
      year: tempData.year ?? new Date().getUTCFullYear(),
      status: "ACTIVE",
      participants: [],
      absent: [],
      results: [],
      createdAt: Date.now(),
      reminderSent: false,
      started: false,
      reminderBefore: tempData.reminderBefore ?? 60,
      eventType: tempData.eventType
    };

    await createEvent(newEvent);
    tempEventStore.delete(tempId);

    if (interaction.guild && tempData.notifyOnCreate) {
      await sendEventCreatedNotification(newEvent, interaction.guild);
    }

    await safeReply(interaction, {
      content: `Event **${newEvent.name}** scheduled successfully.`,
      components: [],
      ephemeral: true
    });

    logger.emit({
      scope: "events.create",
      event: "event_created",
      traceId,
      context: {
        eventId: newEvent.id,
        guildId: newEvent.guildId,
        type: newEvent.eventType,
      },
    });

  } catch (err) {
    logger.emit({
      scope: "events.create",
      event: "create_failed",
      traceId,
      level: "error",
      context: { tempId },
      error: err,
    });

    await safeReply(interaction, {
      content: "❌ Failed to create event.",
      ephemeral: true
    });
  }
}

// -----------------------------------------------------------
// ENTRY POINTS (NEW TRACE)
// -----------------------------------------------------------
export async function handleNotificationResponse(interaction: ButtonInteraction) {
  const traceId = createTraceId();

  const [, tempId] = interaction.customId.split(/-(.+)/);
  const tempData = tempEventStore.get(tempId);

  if (!tempData) {
    logger.emit({
      scope: "events.create",
      event: "notification_temp_missing",
      traceId,
      context: { tempId },
    });

    await safeReply(interaction, { content: "Temporary event data not found.", components: [], ephemeral: true });
    return;
  }

  tempData.notifyOnCreate = interaction.customId.startsWith("notify_create_yes");

  logger.emit({
    scope: "events.create",
    event: "notification_decision",
    traceId,
    context: {
      tempId,
      notify: tempData.notifyOnCreate,
    },
  });

  await finalizeEvent(interaction, tempId, traceId);
}

export async function finalizeNextYearEvent(interaction: ButtonInteraction | ModalSubmitInteraction) {
  const traceId = createTraceId();

  const [, tempId] = interaction.customId.split(/-(.+)/);
  const tempData = tempEventStore.get(tempId);

  if (!tempData) {
    logger.emit({
      scope: "events.create",
      event: "next_year_temp_missing",
      traceId,
      context: { tempId },
    });

    await safeReply(interaction, { content: "Temporary event data not found.", components: [], ephemeral: true });
    return;
  }

  tempData.year = new Date().getUTCFullYear() + 1;

  logger.emit({
    scope: "events.create",
    event: "next_year_selected",
    traceId,
    context: { tempId },
  });

  if (tempData.eventType !== "birthdays") {
    await showCreateNotificationConfirm(interaction, tempId, traceId);
  } else {
    await finalizeEvent(interaction, tempId, traceId);
  }
}