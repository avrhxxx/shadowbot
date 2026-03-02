// src/events/eventPanel.ts
import {
  Client,
  Interaction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  EmbedBuilder,
  TextChannel
} from "discord.js";

import {
  createEvent,
  getEvents,
  getActiveEvents,
  getPastEvents,
  cancelEvent,
  updateEventStatuses,
  setDefaultChannel,
  getDefaultChannel,
  generateParticipantsFile,
  EventObject
} from "./eventService";

// ===== PENDING EVENT CREATION =====
const pendingEvents: Map<string, Partial<EventObject>> = new Map();

// ===== EVENT HANDLER =====
export async function handleEventInteraction(interaction: Interaction) {
  if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isStringSelectMenu()) return;

  const guildId = interaction.guildId!;
  updateEventStatuses(guildId);

  // ===== BUTTONS =====
  if (interaction.isButton()) {
    switch (interaction.customId) {

      // ----- CREATE EVENT -----
      case "event_create": {
        const modal = new ModalBuilder()
          .setCustomId("event_create_modal")
          .setTitle("Create Event");

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("event_name")
              .setLabel("Event Name")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("event_day")
              .setLabel("Day (1-31)")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("event_month")
              .setLabel("Month (1-12)")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("event_time")
              .setLabel("Time (HH:MM)")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("event_reminder")
              .setLabel("Reminder Before (min)")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );

        await interaction.showModal(modal);
        return;
      }

      // ----- LIST EVENTS -----
      case "event_list": {
        const events = getEvents(guildId);
        if (!events.length) {
          await interaction.reply({ content: "No events found.", ephemeral: true });
          return;
        }

        const embed = new EmbedBuilder().setTitle("📅 Events").setColor("Blue");
        for (const e of events) {
          const statusEmoji = e.status === "ACTIVE" ? "🟢" : e.status === "PAST" ? "🔴" : "⚪";
          embed.addFields({
            name: `${statusEmoji} ${e.name}`,
            value: `📆 ${e.day}-${e.month} ${e.hour}:${e.minute} | Participants: ${e.participants.length}`
          });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      // ----- SETTINGS -----
      case "event_settings": {
        const channels = interaction.guild?.channels.cache
          .filter(c => c.isTextBased())
          .map(c => ({ label: c.name, value: c.id })) || [];

        const select = new StringSelectMenuBuilder()
          .setCustomId("event_settings_select")
          .setPlaceholder("Select default channel")
          .addOptions(channels);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

        await interaction.reply({ content: "Select default channel for event notifications:", components: [row], ephemeral: true });
        return;
      }

      // ----- MANUAL REMINDER -----
      case "event_manual_reminder": {
        const channelId = getDefaultChannel(guildId);
        if (!channelId) {
          await interaction.reply({ content: "Default channel not set.", ephemeral: true });
          return;
        }

        const activeEvents = getActiveEvents(guildId);
        if (!activeEvents.length) {
          await interaction.reply({ content: "No active events.", ephemeral: true });
          return;
        }

        const channel = interaction.guild?.channels.cache.get(channelId) as TextChannel;
        if (!channel) {
          await interaction.reply({ content: "Default channel not found.", ephemeral: true });
          return;
        }

        for (const e of activeEvents) {
          const embed = new EmbedBuilder()
            .setTitle(`🔔 Reminder: ${e.name}`)
            .setDescription(`Starts at ${e.hour}:${e.minute} on ${e.day}-${e.month}`);
          await channel.send({ embeds: [embed] });
        }

        await interaction.reply({ content: "Reminders sent.", ephemeral: true });
        return;
      }

      // ----- CANCEL EVENT -----
      case "event_cancel": {
        const activeEvents = getActiveEvents(guildId);
        if (!activeEvents.length) {
          await interaction.reply({ content: "No active events to cancel.", ephemeral: true });
          return;
        }

        const options = activeEvents.map(e => ({ label: e.name, value: e.id }));
        const select = new StringSelectMenuBuilder()
          .setCustomId("event_cancel_select")
          .setPlaceholder("Select event to cancel")
          .addOptions(options);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        await interaction.reply({ content: "Select event to cancel:", components: [row], ephemeral: true });
        return;
      }

      // ----- DOWNLOAD PARTICIPANTS -----
      case "event_download": {
        const pastEvents = getPastEvents(guildId);
        if (!pastEvents.length) {
          await interaction.reply({ content: "No past events found.", ephemeral: true });
          return;
        }

        const options = pastEvents.map(e => ({ label: e.name, value: e.id }));
        const select = new StringSelectMenuBuilder()
          .setCustomId("event_download_select")
          .setPlaceholder("Select past event")
          .addOptions(options);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        await interaction.reply({ content: "Select past event to download participants:", components: [row], ephemeral: true });
        return;
      }

      // ----- HELP -----
      case "event_help": {
        const embed = new EmbedBuilder()
          .setTitle("Event Panel Help")
          .setDescription(
            "📌 **Buttons:**\n" +
            "Create → Create a new event\n" +
            "List → List all events\n" +
            "⚙️ Settings → Set default channel\n" +
            "🔔 Manual Reminder → Send reminder for active events\n" +
            "🗑️ Cancel → Cancel an active event\n" +
            "⬇️ Download → Download participants of past events"
          );
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
    }
  }

  // ===== MODAL SUBMIT =====
  if (interaction.isModalSubmit() && interaction.customId === "event_create_modal") {
    const name = interaction.fields.getTextInputValue("event_name");
    const day = Number(interaction.fields.getTextInputValue("event_day"));
    const month = Number(interaction.fields.getTextInputValue("event_month"));
    const [hour, minute] = interaction.fields.getTextInputValue("event_time").split(":").map(Number);
    const reminderBefore = Number(interaction.fields.getTextInputValue("event_reminder"));

    createEvent(guildId, name, day, month, hour, minute, reminderBefore);
    await interaction.reply({ content: `✅ Event **${name}** created.`, ephemeral: true });
    return;
  }

  // ===== SELECT MENU SUBMIT =====
  if (interaction.isStringSelectMenu()) {
    switch (interaction.customId) {
      case "event_settings_select": {
        setDefaultChannel(guildId, interaction.values[0]);
        await interaction.reply({ content: `Default channel set.`, ephemeral: true });
        return;
      }

      case "event_cancel_select": {
        cancelEvent(guildId, interaction.values[0]);
        await interaction.reply({ content: `Event cancelled.`, ephemeral: true });
        return;
      }

      case "event_download_select": {
        const eventId = interaction.values[0];
        const filePath = generateParticipantsFile(guildId, eventId);

        const channelId = getDefaultChannel(guildId);
        const channel = interaction.guild?.channels.cache.get(channelId!) as TextChannel;

        if (channel) {
          await channel.send({ content: `📥 Participants file for event`, files: [filePath] });
          await interaction.reply({ content: "File sent to default channel.", ephemeral: true });
        } else {
          await interaction.reply({ content: "Default channel not found.", ephemeral: true });
        }
        return;
      }
    }
  }
}

// ===== INIT EVENT PANEL =====
export function initEventPanel(client: Client) {
  console.log(`EventPanel initialized for client ${client.user?.tag}`);
}