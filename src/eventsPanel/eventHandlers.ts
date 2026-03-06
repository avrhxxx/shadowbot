// src/eventsPanel/eventHandlers.ts
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
    if (customId.startsWith("event_add_")) return await handleAddParticipant(interaction, customId.replace("event_add_", ""));
    if (customId.startsWith("event_remove_")) return await handleRemoveParticipant(interaction, customId.replace("event_remove_", ""));
    if (customId.startsWith("event_absent_")) return await handleAbsentParticipant(interaction, customId.replace("event_absent_", ""));

    // Compare
    if (customId.startsWith("event_compare_")) return await handleCompareButton(interaction, customId.replace("event_compare_", ""));
    if (customId.startsWith("compare_download_")) return await handleCompareDownload(interaction);
    if (customId === "compare_all_events") return await handleCompareAll(interaction);
    if (customId.startsWith("compare_all_download_")) return await handleCompareAllDownload(interaction);

    // Show List / Download
    if (customId.startsWith("event_show_list_")) return await handleShowList(interaction, customId.replace("event_show_list_", ""));
    if (customId.startsWith("event_download_single_")) return await handleDownload(interaction, customId.replace("event_download_single_", ""));
    if (customId === "download_all_events") return await handleDownload(interaction);

    // Show All
    if (customId === "event_show_all") return await handleShowAllEvents(interaction);
    if (customId === "show_all_lists") return await handleShowAllLists(interaction);

    // New Year Buttons
    if (customId === "next_year_yes" || customId === "next_year_no") {
      const storedData = tempEventStore.get(tempKey);
      if (!storedData) return await interaction.update({ content: "Temporary event data not found. Please try again.", components: [] });

      if (customId === "next_year_no") {
        tempEventStore.delete(tempKey);
        return await interaction.update({ content: "Event was not added.", components: [] });
      }

      storedData.year = new Date().getUTCFullYear() + 1;
      return await showReminderSelect(interaction, tempKey);
    }
  }

  /* 🔹 SELECT MENUS */
  if (interaction.isStringSelectMenu()) {
    if (customId.startsWith("reminder_select_")) return await finalizeEventWithReminder(interaction as StringSelectMenuInteraction);
    if (customId.startsWith("compare_select_")) return await handleCompareSelect(interaction);
    if (customId === "event_settings_notification" || customId === "event_settings_download") return await handleSettingsSelect(interaction);
    if (customId === "event_cancel_select") return await handleCancelSelect(interaction);

    if (customId === "manual_reminder_select") {
      const selectedEventId = interaction.values[0];
      const events = await EventStorage.getEvents(interaction.guildId!);
      const event = events.find(e => e.id === selectedEventId);
      if (!event) return await interaction.update({ content: "Event not found.", components: [] });

      const config = await EventStorage.getConfig(interaction.guildId!);
      const channel = guild.channels.cache.get(config?.notificationChannelId ?? "") as TextChannel;
      if (!channel || !channel.isTextBased()) return await interaction.update({ content: "Notification channel invalid.", components: [] });

      await sendReminderMessage(channel, event);
      return await interaction.update({ content: `Manual reminder sent for **${event.name}**`, components: [] });
    }
  }

  /* 🔹 MODALS */
  if (interaction.isModalSubmit()) {
    if (customId.startsWith("event_add_modal_")) return await handleAddParticipantSubmit(interaction, customId.replace("event_add_modal_", ""));
    if (customId.startsWith("event_remove_modal_")) return await handleRemoveParticipantSubmit(interaction, customId.replace("event_remove_modal_", ""));
    if (customId.startsWith("event_absent_modal_")) return await handleAbsentParticipantSubmit(interaction, customId.replace("event_absent_modal_", ""));
    if (customId === "event_create_modal") return await handleCreateSubmit(interaction);
  }

  /* 🔹 STANDARD BUTTONS – Event Panel */
  if (interaction.isButton()) {
    switch (customId) {
      case "event_create": return await handleCreate(interaction);
      case "event_list": return await handleList(interaction);
      case "event_cancel": return await handleCancel(interaction);
      case "event_cancel_abort": return await handleCancelAbort(interaction);
      case "event_settings": return await handleSettings(interaction);
      case "event_help": return await handleHelp(interaction);
      case "event_manual_reminder": return await handleManualReminder(interaction);
      default: console.warn(`Unsupported event customId: ${customId}`);
    }
  }
}

/* =======================================================
   🔹 Funkcja dla przycisku Manual Reminder
======================================================= */
async function handleManualReminder(interaction: ButtonInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  const events = await EventStorage.getEvents(interaction.guildId!);
  const upcomingEvents = events.filter(e => e.status !== "PAST");

  if (!upcomingEvents.length) return await interaction.reply({ content: "No upcoming events to remind.", ephemeral: true });

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