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
import { handleCreateSubmit, tempEventStore, showCreateNotificationConfirm } from "./eventsButtons/eventsCreateSubmit";
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
import { sendReminderMessage, sendEventCreatedNotification } from "./eventsButtons/eventsReminder";
import { handleClearEventButton, handleClearEventConfirm, handleClearEventAbort } from "./eventsButtons/eventsClear";

export async function handleEventInteraction(interaction: Interaction): Promise<void> {
  if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isStringSelectMenu()) return;
  const { customId, guild } = interaction;
  if (!guild) return;

  const tempKey = `${interaction.user.id}-temp`;

  /* BUTTONS */
  if (interaction.isButton()) {
    // --- POWIADOMIENIE O CREATE ---
    if (customId.startsWith("notify_create_")) {
      const tempData = tempEventStore.get(tempKey);
      if (!tempData) {
        await interaction.update({ content: "Temporary event data not found.", components: [] });
        return;
      }
      tempData.notifyOnCreate = customId === `notify_create_yes-${tempKey}`;

      // Finalizacja eventu po wyborze
      await finalizeEvent(tempKey, interaction);
      return;
    }

    // YEAR CHECK
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
      await showCreateNotificationConfirm(interaction, tempKey);
      return;
    }

    // PANEL BUTTONS
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
    }
  }

  /* SELECT MENUS */
  if (interaction.isStringSelectMenu()) {
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
    if (customId === "event_create_modal") {
      await handleCreateSubmit(interaction);
      return;
    }
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
  }
}

/* FINALIZE EVENT */
async function finalizeEvent(tempKey: string, interaction: ButtonInteraction | StringSelectMenuInteraction) {
  const tempData = tempEventStore.get(tempKey);
  if (!tempData) {
    await interaction.update({ content: "Temporary event data not found.", components: [] });
    return;
  }

  const events = await EventService.getEvents(tempData.guildId);

  const newEvent: EventService.EventObject = {
    id: tempData.eventId || `${Date.now()}`,
    guildId: tempData.guildId,
    name: tempData.name,
    day: tempData.day,
    month: tempData.month,
    hour: tempData.hour,
    minute: tempData.minute,
    year: tempData.year!,
    status: "ACTIVE",
    participants: [],
    absent: [],
    createdAt: Date.now(),
    reminderSent: false,
    started: false,
    reminderBefore: tempData.reminderBefore
  };

  await EventService.saveEvents(tempData.guildId, [...events, newEvent]);
  tempEventStore.delete(tempKey);

  if (tempData.notifyOnCreate && interaction.guild) {
    await sendEventCreatedNotification(newEvent, interaction.guild);
  }

  await interaction.update({ content: `Event **${newEvent.name}** scheduled successfully.`, components: [] });
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