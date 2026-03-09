import {
  ModalSubmitInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  BaseInteraction
} from "discord.js";
import { v4 as uuidv4 } from "uuid";

import { createEvent, EventObject } from "../eventService";
import { getEventDateUTC } from "../../utils/timeUtils";
import { sendEventCreatedNotification } from "./eventsReminder";

// Helpers – lokalny plik
import { tempEventStore, canReply, safeReply, parseEventDateTime } from "./tempEventHelpers";

export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
  const guildId = interaction.guildId!;
  const typeMatch = interaction.customId.match(/^event_create_modal_(.+)$/);
  const eventType = typeMatch ? typeMatch[1] : "custom";

  let name = "";
  let datetimeRaw = "";
  let year: number | undefined;

  try { name = interaction.fields.getTextInputValue("event_name"); } catch {}
  try { datetimeRaw = interaction.fields.getTextInputValue("event_datetime"); } catch {}

  let day: number, month: number, hour = 0, minute = 0;

  if (eventType === "birthdays") {
    const dateMatch = datetimeRaw.trim().match(/^(\d{1,2})[./-]?(\d{1,2})$/);
    if (!dateMatch) {
      await safeReply(interaction, { content: "Invalid date format. Use DD/MM.", ephemeral: true });
      return;
    }
    day = parseInt(dateMatch[1], 10);
    month = parseInt(dateMatch[2], 10);
    hour = 0;
    minute = 0;
    year = new Date().getUTCFullYear();
  } else {
    const parsed = parseEventDateTime(datetimeRaw);
    if (!parsed) {
      await safeReply(interaction, { content: "Invalid date/time format.", ephemeral: true });
      return;
    }
    day = parsed.day;
    month = parsed.month;
    hour = parsed.hour;
    minute = parsed.minute;
    year = parsed.year ?? new Date().getUTCFullYear();
  }

  const tempId = `E-${uuidv4()}`;

  tempEventStore.set(tempId, {
    id: tempId,
    name,
    day,
    month,
    hour,
    minute,
    guildId,
    year,
    eventType,
    reminderBefore: eventType === "birthdays" ? 0 : 60
  });

  await showCreateNotificationConfirm(interaction, tempId);
}

async function showCreateNotificationConfirm(interaction: BaseInteraction, tempId: string) {
  const tempData = tempEventStore.get(tempId);
  if (!tempData) return;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`notify_create_yes-${tempId}`).setLabel("Yes").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`notify_create_no-${tempId}`).setLabel("No").setStyle(ButtonStyle.Danger)
  );

  await safeReply(interaction, {
    content: "Do you want to send a notification about creating this event?",
    components: [row],
    ephemeral: true
  });
}