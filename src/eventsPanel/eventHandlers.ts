import {
  Interaction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
} from "discord.js";
import * as EventStorage from "./eventStorage";

// Buttons / modals / selects
import { handleCreate } from "./eventsButtons/eventsCreate";
import { handleCreateSubmit, tempEventStore, finalizeEventWithReminder, showReminderSelect } from "./eventsButtons/eventsCreateSubmit";
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

// Compare imports
import {
  handleCompareButton,
  handleCompareSelect,
  handleCompareDownload,
  handleCompareAll,
  handleCompareAllDownload
} from "./eventsButtons/eventsCompare";

// Show All Events
import { handleShowAllEvents, handleShowAllLists } from "./eventsButtons/eventsShowAll";

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

// Clear Event Data
import { handleClearEventButton, handleClearEventSubmit } from "./eventsButtons/eventsClear";

/* =======================================================
   🔹 Handler interakcji dla całego Event Panelu
======================================================= */
export async function handleEventInteraction(interaction: Interaction): Promise<void> {
  if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isStringSelectMenu()) return;

  const { customId, guild } = interaction;
  if (!guild) return;

  /* 🔹 DYNAMIC – CONFIRM CANCEL */
  if (interaction.isButton() && customId.startsWith("event_cancel_confirm_")) {
    const eventId = customId.replace("event_cancel_confirm_", "");
    await handleCancelConfirm(interaction, eventId);
    return;
  }

  /* 🔹 DYNAMIC – BUTTONS */
  if (interaction.isButton()) {
    const tempKey = `${interaction.user.id}-temp`;

    // Participants
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

    // Compare
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

    // Show List / Download Single
    if (customId.startsWith("event_show_list_")) {
      await handleShowList(interaction, customId.replace("event_show_list_", ""));
      return;
    }
    if (customId.startsWith("event_download_single_")) {
      await handleDownload(interaction, customId.replace("event_download_single_", ""));
      return;
    }

    // Clear Event Data
    if (customId.startsWith("event_clear_")) {
      const eventId = customId.replace("event_clear_", "");
      const events = await EventStorage.getEvents(interaction.guildId!);
      const event = events.find(e => e.id === eventId);
      if (!event) {
        await interaction.reply({ content: "Event not found.", ephemeral: true });
        return;
      }
      await handleClearEventButton(interaction, eventId, event.name);
      return;
    }

    // Download All – zwykły przycisk
    if (customId === "download_all_events") {
      await handleDownload(interaction);
      return;
    }

    // Show All / Show All Lists
    if (customId === "event_show_all") {
      await handleShowAllEvents(interaction);
      return;
    }
    if (customId === "show_all_lists") {
      await handleShowAllLists(interaction);
      return;
    }

    // New Year Buttons
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
  }

  /* 🔹 SELECT MENUS */
  if (interaction.isStringSelectMenu()) {
    if (customId.startsWith("reminder_select_")) {
      await finalizeEventWithReminder(interaction as StringSelectMenuInteraction);
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
      const events = await EventStorage.getEvents(interaction.guildId!);
      const event = events.find(e => e.id === selectedEventId);
      if (!event) {
        await interaction.update({ content: "Event not found.", components: [] });
        return;
      }

      const config = await EventStorage.getConfig(interaction.guildId!);
      const channel = guild.channels.cache.get(config?.notificationChannelId ?? "") as TextChannel;
      if (!channel || !channel.isTextBased()) {
        await interaction.update({ content: "Notification channel invalid.", components: [] });
        return;
      }

      await sendReminderMessage(channel, event);
      await interaction.update({ content: `Manual reminder sent for **${event.name}**`, components: [] });
      return;
    }
  }

  /* 🔹 MODALS */
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

    // Clear Event Submit Modal
    if (customId.startsWith("confirm_clear_event_")) {
      await handleClearEventSubmit(interaction);
      return;
    }
  }

  /* 🔹 STANDARD BUTTONS – Event Panel */
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
async function handleManualReminder(interaction: ButtonInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) return;

  const events = await EventStorage.getEvents(interaction.guildId!);
  const upcomingEvents = events.filter(e => e.status !== "PAST");

  if (!upcomingEvents.length) {
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