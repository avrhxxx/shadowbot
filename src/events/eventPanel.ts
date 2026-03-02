// src/events/eventPanel.ts
import {
  Interaction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  EmbedBuilder,
  TextChannel,
  Guild
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
  EventObject
} from "./eventService";

// ======= PENDING CREATION STORAGE =======
const pendingEvents: Map<string, Partial<EventObject>> = new Map();

// ======= HANDLER =======
export async function handleEventInteraction(interaction: Interaction) {
  if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isStringSelectMenu()) return;

  const guildId = interaction.guildId!;
  updateEventStatuses(guildId); // Aktualizacja statusów przy każdym wywołaniu

  // ======= BUTTONS =======
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
          let statusEmoji = e.status === "ACTIVE" ? "🟢" : e.status === "PAST" ? "🔴" : "⚪";
          embed.addFields({
            name: `${statusEmoji} ${e.name}`,
            value: `📆 ${e.day}-${e.month} ${e.hour}:${e.minute} | Participants: ${e.participants.length}`
          });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
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

  // ======= MODAL SUBMIT =======
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "event_create_modal") {
      const name = interaction.fields.getTextInputValue("event_name");
      const day = Number(interaction.fields.getTextInputValue("event_day"));
      const month = Number(interaction.fields.getTextInputValue("event_month"));
      const [hour, minute] = interaction.fields.getTextInputValue("event_time").split(":").map(Number);
      const reminderBefore = Number(interaction.fields.getTextInputValue("event_reminder"));

      // Walidacja
      if (day < 1 || day > 31 || month < 1 || month > 12 || hour < 0 || hour > 23 || minute < 0 || minute > 59 || reminderBefore < 0) {
        await interaction.reply({ content: "Invalid input values.", ephemeral: true });
        return;
      }

      const event = createEvent(guildId, name, day, month, hour, minute, reminderBefore);
      await interaction.reply({ content: `✅ Event **${name}** created.`, ephemeral: true });
      return;
    }
  }

  // ======= SELECT MENU =======
  if (interaction.isStringSelectMenu()) {
    // Tu pójdą np. ustawienia kanału, anulowanie eventów, pobieranie uczestników
    // Będzie prosty routing wg customId np. event_settings_select / event_cancel_select
  }
}