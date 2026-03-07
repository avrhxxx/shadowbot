// src/eventsPanel/eventHandlers.ts
import {
  Interaction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  TextChannel,
} from "discord.js";

import * as EventService from "./eventService";

import { handleCreate } from "./eventsButtons/eventsCreate";
import {
  handleCreateSubmit,
  tempEventStore,
  finalizeEventWithReminder,
  showReminderSelect,
} from "./eventsButtons/eventsCreateSubmit";
import { handleList, handleShowList } from "./eventsButtons/eventsList";

import {
  handleCancel,
  handleCancelSelect,
  handleCancelConfirm,
  handleCancelAbort,
} from "./eventsButtons/eventsCancel";
import { handleDownload } from "./eventsButtons/eventsDownload";
import { handleSettings, handleSettingsSelect } from "./eventsButtons/eventsSettings";
import { handleHelp } from "./eventsButtons/eventsHelp";
import {
  handleCompareButton,
  handleCompareSelect,
  handleCompareDownload,
  handleCompareAll,
  handleCompareAllDownload,
} from "./eventsButtons/eventsCompare";
import { handleShowAllEvents, handleShowAllLists } from "./eventsButtons/eventsShowAll";
import {
  handleAddParticipant,
  handleRemoveParticipant,
  handleAbsentParticipant,
  handleAddParticipantSubmit,
  handleRemoveParticipantSubmit,
  handleAbsentParticipantSubmit,
} from "./eventsButtons/eventsParticipants";
import { sendReminderMessage } from "./eventsButtons/eventsReminder";
import { handleClearEventButton, handleClearEventConfirm, handleClearEventAbort } from "./eventsButtons/eventsClear";

/* =======================================================
   EVENT INTERACTION HANDLER
======================================================= */
export async function handleEventInteraction(interaction: Interaction): Promise<void> {
  if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isStringSelectMenu()) return;

  const { customId, guild } = interaction;
  if (!guild) return;

  const tempKey = `${interaction.user.id}-temp`;

  /* CANCEL CONFIRM */
  if (interaction.isButton() && customId.startsWith("event_cancel_confirm_")) {
    const eventId = customId.replace("event_cancel_confirm_", "");
    await handleCancelConfirm(interaction, eventId);
    return;
  }

  /* BUTTONS */
  if (interaction.isButton()) {

    // PARTICIPANTS
    if (customId.startsWith("event_add_")) {
      await handleAddParticipant(interaction, customId.replace("event_add_", ""));
      return;
    }
    if (customId.startsWith("event_remove_")) {
      await handleRemoveParticipant(interaction, customId.replace("event_remove_", ""));
      return;
    }
    if (customId.startsWith("event_absent_")) {
      await handleAbsentParticipant(interaction, customId.replace("event_absent_", ""));
      return;
    }

    // COMPARE
    if (customId.startsWith("event_compare_")) {
      await handleCompareButton(interaction, customId.replace("event_compare_", ""));
      return;
    }
    if (customId.startsWith("compare_download_")) {
      await handleCompareDownload(interaction);
      return;
    }
    if (customId === "compare_all_events") {
      await handleCompareAll(interaction);
      return;
    }
    if (customId.startsWith("compare_all_download")) {
      await handleCompareAllDownload(interaction);
      return;
    }

    // SHOW LIST / DOWNLOAD
    if (customId.startsWith("event_show_list_")) {
      await handleShowList(interaction, customId.replace("event_show_list_", ""));
      return;
    }
    if (customId.startsWith("event_download_single_")) {
      await handleDownload(interaction, customId.replace("event_download_single_", ""));
      return;
    }

    // CLEAR
    if (customId === "event_clear_confirm") {
      await handleClearEventConfirm(interaction);
      return;
    }
    if (customId === "event_clear_abort") {
      await handleClearEventAbort(interaction);
      return;
    }
    if (customId.startsWith("event_clear_")) {
      const eventId = customId.replace("event_clear_", "");
      const events = await EventService.getEvents(guild.id);
      const event = events.find(e => e.id === eventId);
      if (!event) {
        await interaction.reply({ content: "Event not found.", ephemeral: true });
        return;
      }
      await handleClearEventButton(interaction, eventId, event.name);
      return;
    }

    // SHOW ALL / DOWNLOAD ALL
    if (customId === "download_all_events") {
      await handleDownload(interaction);
      return;
    }
    if (customId === "event_show_all") {
      await handleShowAllEvents(interaction);
      return;
    }
    if (customId === "show_all_lists") {
      await handleShowAllLists(interaction);
      return;
    }

    /* YEAR CHECK */
    if (customId === "next_year_yes" || customId === "next_year_no") {
      const storedData = tempEventStore.get(tempKey);
      if (!storedData) {
        await interaction.update({ content: "Temporary event data not found. Please try again.", components: [] });
        return;
      }
      if (customId === "next_year_no") {
        tempEventStore.delete(tempKey);
        await interaction.update({ content: "Event was not added.", components: [] });
        return;
      }
      storedData.year = new Date().getUTCFullYear() + 1;
      await showReminderSelect(interaction, tempKey);
      return;
    }

    /* PANEL BUTTONS */
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

  /* SELECT MENUS */
  if (interaction.isStringSelectMenu()) {
    // --- POPRAWKA: dopasowanie customId remindera ---
    if (customId.startsWith("reminder_select_")) {
      const tempKeyFromId = customId.replace("reminder_select_", "");
      await finalizeEventWithReminder(interaction, tempKeyFromId);
      return;
    }
    if (customId.startsWith("compare_select_")) {
      await handleCompareSelect(interaction);
      return;
    }
    if (customId === "event_settings_notification" || customId === "event_settings_download") {
      await handleSettingsSelect(interaction);
      return;
    }
    if (customId === "event_cancel_select") {
      await handleCancelSelect(interaction);
      return;
    }
    if (customId === "manual_reminder_select") {
      const selectedEventId = interaction.values[0];
      const events = await EventService.getEvents(guild.id);
      const event = events.find(e => e.id === selectedEventId);
      if (!event) {
        await interaction.update({ content: "Event not found.", components: [] });
        return;
      }

      const config = await EventService.getConfig(guild.id);
      const channelId = config.notificationChannel?.[0];
      if (!channelId) {
        await interaction.update({ content: "Notification channel not set.", components: [] });
        return;
      }

      const rawChannel = guild.channels.cache.get(channelId);
      if (!rawChannel || !rawChannel.isTextBased()) {
        await interaction.update({ content: "Notification channel invalid.", components: [] });
        return;
      }

      const channel = rawChannel as TextChannel;
      await sendReminderMessage(channel, event);
      await interaction.update({ content: `Manual reminder sent for **${event.name}**`, components: [] });
    }
  }

  /* MODALS */
  if (interaction.isModalSubmit()) {
    if (customId.startsWith("event_add_modal_")) {
      await handleAddParticipantSubmit(interaction, customId.replace("event_add_modal_", ""));
      return;
    }
    if (customId.startsWith("event_remove_modal_")) {
      await handleRemoveParticipantSubmit(interaction, customId.replace("event_remove_modal_", ""));
      return;
    }
    if (customId.startsWith("event_absent_modal_")) {
      await handleAbsentParticipantSubmit(interaction, customId.replace("event_absent_modal_", ""));
      return;
    }
    if (customId === "event_create_modal") {
      await handleCreateSubmit(interaction);
      return;
    }
  }
}

/* MANUAL REMINDER */
async function handleManualReminder(interaction: ButtonInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) return;

  const events = await EventService.getEvents(guild.id);
  const upcomingEvents = events.filter(e => e.status !== "PAST");

  if (!upcomingEvents.length) {
    await interaction.reply({ content: "No upcoming events to remind.", ephemeral: true });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId("manual_reminder_select")
    .setPlaceholder("Select an event to manually send a reminder")
    .addOptions(
      upcomingEvents.map(ev => ({
        label: ev.name,
        description: `UTC: ${ev.day}/${ev.month} ${ev.hour}:${ev.minute}`,
        value: ev.id
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({
    content: "Select an event to manually send a reminder:",
    components: [row],
    ephemeral: true
  });
}