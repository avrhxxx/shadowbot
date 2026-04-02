// 📁 src/systems/events/actions/events.create.action.ts

import { registerUIAction } from "@/ui/core/uiRouter";
import { createLogger } from "@/foundation/logger";
import { getFutureDays } from "../utils/dateUtils";

import type { ButtonInteraction, ModalSubmitInteraction, Interaction } from "discord.js";
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// =====================================
// 🔹 REGISTER CREATE EVENT ACTION
// =====================================

registerUIAction("events.create", {
  system: "events",

  handler: async (interaction: Interaction, ctx, payload: any) => {
    const log = createLogger(ctx);
    const flow = log.flow("events.create");
    flow.start();

    try {
      // 🔹 Step: start - wybór typu eventu
      if ("isButton" in interaction && interaction.isButton() && payload?.step === "start") {
        const typeOptions = [
          { label: "Custom", value: "custom" },
          { label: "Birthday", value: "birthdays" },
          { label: "Reservoir Raid", value: "reservoir_raid" },
          { label: "Arcadian Conquest", value: "arcadian_conquest" },
          { label: "City Contest", value: "city_contest" },
          { label: "Ghoulion Pursuit", value: "ghoulion_pursuit" },
        ];

        const rows = [];
        for (let i = 0; i < typeOptions.length; i += 5) {
          rows.push({
            type: 1,
            components: typeOptions.slice(i, i + 5).map((opt) => ({
              type: 2,
              label: opt.label,
              style: 1,
              custom_id: `events.create|step=type|type=${opt.value}`,
            })),
          });
        }

        if ("reply" in interaction) {
          await interaction.reply({ content: "Select event type:", components: rows, ephemeral: true });
        }
        flow.success();
        return;
      }

      // 🔹 Step: type
      if ("isButton" in interaction && interaction.isButton() && payload?.step === "type") {
        const eventType = payload.type;
        if (!eventType) throw new Error("event_type_missing");

        if (["custom", "birthdays"].includes(eventType)) {
          // Pokazujemy modal do wpisania nazwy
          if ("showModal" in interaction) {
            const modal = new ModalBuilder()
              .setCustomId(`events.create|step=name|type=${eventType}`)
              .setTitle("Enter Event Name");

            const nameInput = new TextInputBuilder()
              .setCustomId("event_name")
              .setLabel("Event Name")
              .setStyle(TextInputStyle.Short)
              .setMinLength(3)
              .setMaxLength(100)
              .setRequired(true);

            modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput));

            await interaction.showModal(modal);
          }
        } else {
          await proceedToDaySelect(interaction, eventType, eventType);
        }
        flow.success();
        return;
      }

      // 🔹 Step: name (modal)
      if ("isModalSubmit" in interaction && interaction.isModalSubmit() && payload?.step === "name") {
        const eventType = payload.type;
        const eventName = interaction.fields.getTextInputValue("event_name");
        if (!eventName) throw new Error("event_name_missing");

        await proceedToDaySelect(interaction, eventType, eventName);
        flow.success();
        return;
      }

      // 🔹 Step: day (po wybraniu przycisku daty)
      if ("isButton" in interaction && interaction.isButton() && payload?.step === "day") {
        const eventType = payload.type;
        const eventName = payload.name;
        const dayValue = payload.day; // "2026-04-16" np z getFutureDays

        // pokaż modal do wpisania godziny
        if ("showModal" in interaction) {
          const modal = new ModalBuilder()
            .setCustomId(`events.create|step=hour|type=${eventType}|name=${eventName}|day=${dayValue}`)
            .setTitle(`Set Event Hour for ${eventName}`);

          const hourInput = new TextInputBuilder()
            .setCustomId("event_hour")
            .setLabel("Enter hour (HHMM, e.g., 1530)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(hourInput));

          await interaction.showModal(modal);
        }

        flow.success();
        return;
      }

      // 🔹 Step: hour (po wpisaniu godziny)
      if ("isModalSubmit" in interaction && interaction.isModalSubmit() && payload?.step === "hour") {
        const eventType = payload.type;
        const eventName = payload.name;
        const dayValue = payload.day;
        const hourRaw = interaction.fields.getTextInputValue("event_hour");

        // Tutaj logika do zapisania tymczasowego eventu i pokazania przycisków Yes/No
        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`events.create_notify_yes|type=${eventType}|name=${eventName}|day=${dayValue}|hour=${hourRaw}`).setLabel("Yes").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`events.create_notify_no|type=${eventType}|name=${eventName}|day=${dayValue}|hour=${hourRaw}`).setLabel("No").setStyle(ButtonStyle.Danger)
        );

        if ("reply" in interaction) {
          await interaction.reply({
            content: `Send notification for event **${eventName}** on ${dayValue} at ${hourRaw}?`,
            components: [confirmRow],
            ephemeral: true
          });
        }

        flow.success();
        return;
      }

      flow.fail(new Error("unknown_interaction_type"));
    } catch (err) {
      flow.fail(err);
      if ("reply" in interaction) {
        await interaction.reply({ content: `❌ Failed: ${err}`, ephemeral: true }).catch(() => null);
      }
    }
  },
});

// =====================================
// 🔹 HELPERS
// =====================================

async function proceedToDaySelect(
  interaction: ButtonInteraction | ModalSubmitInteraction | Interaction,
  eventType: string,
  eventName: string
) {
  const days = getFutureDays(14); // 14 dni do przodu

  const rows: any[] = [];
  for (let i = 0; i < days.length; i += 5) {
    rows.push({
      type: 1,
      components: days.slice(i, i + 5).map((d) => ({
        type: 2,
        label: `${d.day} ${MONTH_NAMES[d.month - 1]}`, // Pełna nazwa miesiąca
        style: 1,
        custom_id: `events.create|step=day|type=${eventType}|name=${eventName}|day=${d.value}`,
      })),
    });
  }

  // 🔹 Back button
  rows.push({
    type: 1,
    components: [
      { type: 2, label: "⬅ Back", style: 2, custom_id: "moderator.open|target=hub" },
    ],
  });

  if ("update" in interaction) {
    await interaction.update({
      content: `Select day for event **${eventName}**:`,
      components: rows,
    });
  }
}