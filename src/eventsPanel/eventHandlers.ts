// src/eventsPanel/eventHandlers.ts
import { Interaction, ButtonInteraction, StringSelectMenuInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextChannel, ComponentType, ButtonBuilder, ButtonStyle } from "discord.js";
import * as EventStorage from "./eventStorage";

// Buttons / modals / selects
import { handleCreate } from "./eventsButtons/eventsCreate";
import { handleCreateSubmit } from "./eventsButtons/eventsCreateSubmit";
import { handleList, handleShowList } from "./eventsButtons/eventsList";
import {
  handleCancel,
  handleCancelSelect,
  handleCancelConfirm,
  handleCancelAbort
} from "./eventsButtons/eventsCancel";
import { handleDownload } from "./eventsButtons/eventsDownload";
import { handleSettings, handleSettingsSelect } from "./eventsButtons/eventsSettings";
import { handleHelp } from "./eventsButtons/eventsHelp";

// ✅ NOWE COMPARE IMPORTY
import {
  handleCompareButton,
  handleCompareSelect,
  handleCompareDownload
} from "./eventsButtons/eventsCompare";

// Participants
import {
  handleAddParticipant,
  handleRemoveParticipant,
  handleAbsentParticipant,
  handleAddParticipantSubmit,
  handleRemoveParticipantSubmit,
  handleAbsentParticipantSubmit
} from "./eventsButtons/eventsParticipants";

// Manual Reminder
import { sendReminderMessage } from "./eventsButtons/eventsReminder";

/* =======================================================
   🔹 Handler interakcji dla całego Event Panelu
======================================================= */
export async function handleEventInteraction(interaction: Interaction): Promise<void> {
  if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isStringSelectMenu()) return;

  const { customId } = interaction;

  /* =======================================================
     🔥 DYNAMIC – CONFIRM CANCEL
  ======================================================= */
  if (interaction.isButton() && customId.startsWith("event_cancel_confirm_")) {
    const eventId = customId.replace("event_cancel_confirm_", "");
    await handleCancelConfirm(interaction, eventId);
    return;
  }

  /* =======================================================
     🔥 DYNAMIC – BUTTONS
  ======================================================= */
  if (interaction.isButton()) {

    // Participants
    if (customId.startsWith("event_add_")) {
      const eventId = customId.replace("event_add_", "");
      await handleAddParticipant(interaction, eventId);
      return;
    }

    if (customId.startsWith("event_remove_")) {
      const eventId = customId.replace("event_remove_", "");
      await handleRemoveParticipant(interaction, eventId);
      return;
    }

    if (customId.startsWith("event_absent_")) {
      const eventId = customId.replace("event_absent_", "");
      await handleAbsentParticipant(interaction, eventId);
      return;
    }

    // ✅ COMPARE BUTTON
    if (customId.startsWith("event_compare_")) {
      const eventId = customId.replace("event_compare_", "");
      await handleCompareButton(interaction, eventId);
      return;
    }

    // ✅ COMPARE DOWNLOAD
    if (customId.startsWith("compare_download_")) {
      await handleCompareDownload(interaction);
      return;
    }

    if (customId.startsWith("event_show_list_")) {
      const eventId = customId.replace("event_show_list_", "");
      await handleShowList(interaction, eventId);
      return;
    }

    if (customId.startsWith("event_download_single_")) {
      const eventId = customId.replace("event_download_single_", "");
      await handleDownload(interaction, eventId);
      return;
    }

    // ✅ NEW YEAR BUTTONS
    if (customId === "next_year_yes" || customId === "next_year_no") {
      const storedData = (interaction as any).eventTempData as { guildId: string; name: string; day: number; month: number; hour: number; minute: number; reminderBefore?: number };
      if (!storedData) {
        await interaction.update({ content: "Temporary event data not found. Please try again.", components: [] });
        return;
      }

      if (customId === "next_year_no") {
        await interaction.update({ content: "Event was not added.", components: [] });
        return;
      }

      // Set to next year
      const nextYear = new Date().getUTCFullYear() + 1;
      const { guildId, name, day, month, hour, minute, reminderBefore } = storedData;

      const events = await EventStorage.getEvents(guildId);
      const duplicate = events.find(
        e => e.day === day && e.month === month && e.hour === hour && e.minute === minute && e.status === "ACTIVE"
      );
      if (duplicate) {
        await interaction.update({ content: "An active event at this UTC date and time already exists. Please choose another date/time.", components: [] });
        return;
      }

      const newEvent: EventStorage.EventObject = {
        id: `${Date.now()}`,
        guildId,
        name,
        day,
        month,
        hour,
        minute,
        status: "ACTIVE",
        participants: [],
        createdAt: Date.now(),
        reminderSent: false,
        started: false,
        ...(reminderBefore !== undefined && { reminderBefore })
      };

      await EventStorage.saveEvents(guildId, [...events, newEvent]);

      if (interaction.guild) {
        const { sendEventCreatedNotification } = await import("./eventsButtons/eventsReminder");
        await sendEventCreatedNotification(newEvent, interaction.guild);
      }

      await interaction.update({ content: `Event created for ${day}/${month} ${hour}:${minute} UTC next year.`, components: [] });
      return;
    }
  }

  /* =======================================================
     🔥 SELECT MENUS
  ======================================================= */
  if (interaction.isStringSelectMenu()) {

    // ✅ REMINDER SELECT MENU (ustawienie reminderBefore dla nowego eventu)
    if (customId.startsWith("reminder_select_")) {
      const [, userEventKey] = customId.split("reminder_select_"); // userId-eventId
      const selectedValue = interaction.values[0]; // np. "0", "5", "15" ...
      const reminderMinutes = parseInt(selectedValue, 10);

      const events = await EventStorage.getEvents(interaction.guildId!);
      const eventId = userEventKey.split("-")[1]; // wyciągamy eventId z customId
      const event = events.find(e => e.id === eventId);

      if (!event) {
        await interaction.update({ content: "Event not found. Could not set reminder.", components: [] });
        return;
      }

      if (reminderMinutes > 0) {
        event.reminderBefore = reminderMinutes;
      } else {
        delete event.reminderBefore;
      }

      await EventStorage.saveEvents(interaction.guildId!, events);

      await interaction.update({
        content: `Reminder for **${event.name}** set to ${reminderMinutes > 0 ? `${reminderMinutes} minutes before` : "No reminder"}.`,
        components: []
      });
      return;
    }

    // ✅ COMPARE SELECT
    if (customId.startsWith("compare_select_")) {
      await handleCompareSelect(interaction);
      return;
    }

    // Settings selects
    if (customId === "event_settings_notification" || customId === "event_settings_download") {
      await handleSettingsSelect(interaction);
      return;
    }

    if (customId === "event_cancel_select") {
      await handleCancelSelect(interaction);
      return;
    }

    // Manual Reminder select menu
    if (customId === "manual_reminder_select") {
      const selectedEventId = interaction.values[0];
      const events = await EventStorage.getEvents(interaction.guildId!);
      const event = events.find(e => e.id === selectedEventId);

      if (!event) {
        await interaction.update({ content: "Event not found.", components: [] });
        return;
      }

      const config = await EventStorage.getConfig(interaction.guildId!);
      const channel = interaction.guild!.channels.cache.get(config!.notificationChannelId) as TextChannel;

      if (!channel || !channel.isTextBased()) {
        await interaction.update({ content: "Notification channel invalid.", components: [] });
        return;
      }

      await sendReminderMessage(channel, event);

      await interaction.update({ content: `Manual reminder sent for **${event.name}**`, components: [] });
      return;
    }
  }

  /* =======================================================
     🔥 MODALS
  ======================================================= */
  if (interaction.isModalSubmit()) {

    if (customId.startsWith("event_add_modal_")) {
      const eventId = customId.replace("event_add_modal_", "");
      await handleAddParticipantSubmit(interaction, eventId);
      return;
    }

    if (customId.startsWith("event_remove_modal_")) {
      const eventId = customId.replace("event_remove_modal_", "");
      await handleRemoveParticipantSubmit(interaction, eventId);
      return;
    }

    if (customId.startsWith("event_absent_modal_")) {
      const eventId = customId.replace("event_absent_modal_", "");
      await handleAbsentParticipantSubmit(interaction, eventId);
      return;
    }

    if (customId === "event_create_modal") {
      await handleCreateSubmit(interaction);
      return;
    }
  }

  /* =======================================================
     🔥 STANDARD BUTTONS
  ======================================================= */
  if (interaction.isButton()) {
    switch (customId) {
      case "event_create":
        await handleCreate(interaction);
        break;
      case "event_list":
        await handleList(interaction);
        break;
      case "event_cancel":
        await handleCancel(interaction);
        break;
      case "event_cancel_abort":
        await handleCancelAbort(interaction);
        break;
      case "event_download":
        await handleDownload(interaction);
        break;
      case "event_settings":
        await handleSettings(interaction);
        break;
      case "event_help":
        await handleHelp(interaction);
        break;
      case "event_manual_reminder":
        await handleManualReminder(interaction);
        break;
      default:
        console.warn(`Unsupported event customId: ${customId}`);
    }
  }
}

/* =======================================================
   🔹 Funkcja dla przycisku Manual Reminder
======================================================= */
async function handleManualReminder(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await EventStorage.getEvents(guildId);

  const upcomingEvents = events.filter(e => e.status !== "PAST");
  if (upcomingEvents.length === 0) {
    await interaction.reply({ content: "No upcoming events to remind.", ephemeral: true });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId("manual_reminder_select")
    .setPlaceholder("Select an event to manually send a reminder")
    .addOptions(
      upcomingEvents.map(ev =>
        new StringSelectMenuOptionBuilder()
          .setLabel(ev.name)
          .setDescription(`UTC: ${ev.day}/${ev.month} ${ev.hour}:${ev.minute}`)
          .setValue(ev.id)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({
    content: "Select an event to manually send a reminder:",
    components: [row],
    ephemeral: true
  });
}