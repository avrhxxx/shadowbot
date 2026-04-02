// 📁 src/systems/events/actions/events.create.action.ts

import { registerUIAction } from "@/ui/core/uiRouter";
import { createLogger } from "@/foundation/logger";
import { getFutureDays } from "../utils/dateUtils";

import type { ButtonInteraction, ModalSubmitInteraction } from "discord.js";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// =====================================
// 🔹 REGISTER CREATE EVENT ACTION
// =====================================

registerUIAction("events.create", {
  system: "events",

  handler: async (interaction: ButtonInteraction | ModalSubmitInteraction, ctx, payload: any) => {
    const log = createLogger(ctx);
    const flow = log.flow("events.create");
    flow.start();

    try {
      // 🔹 Step: start - wybór typu eventu
      if ("isButton" in interaction && interaction.isButton() && payload?.step === "start") {
        const typeOptions = [
          { label: "Reservoir Raid", value: "reservoir_raid" },
          { label: "Arcadian Conquest", value: "arcadian_conquest" },
          { label: "City Contest", value: "city_contest" },
          { label: "Ghoulion Pursuit", value: "ghoulion_pursuit" },
          { label: "Birthday", value: "birthdays" },
          { label: "Custom", value: "custom" },
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

        const eventName = formatEventName(eventType);

        if (["custom", "birthdays"].includes(eventType)) {
          if ("showModal" in interaction) {
            await interaction.showModal({
              custom_id: `events.create|step=name|type=${eventType}`,
              title: "Enter Event Name",
              components: [
                {
                  type: 1,
                  components: [
                    {
                      type: 4,
                      custom_id: "event_name",
                      style: 1,
                      label: "Event Name",
                      min_length: 3,
                      max_length: 100,
                    },
                  ],
                },
              ],
            });
          }
        } else {
          await proceedToDaySelect(interaction, eventType, eventName);
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

      // 🔹 Step: day (kliknięcie przycisku daty)
      if ("isButton" in interaction && interaction.isButton() && payload?.step === "day") {
        const eventType = payload.type;
        const eventName = payload.name;
        const dayValue = payload.day; // YYYY-MM-DD

        if (!dayValue) throw new Error("day_value_missing");

        // Po kliknięciu przycisku daty: pokazujemy modal do wpisania godziny
        if ("showModal" in interaction) {
          await interaction.showModal({
            custom_id: `events.create|step=hour|type=${eventType}|name=${eventName}|day=${dayValue}`,
            title: `Set Time for ${eventName}`,
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 4,
                    custom_id: "event_hour",
                    style: 1,
                    label: "Hour (HHMM, UTC)",
                    placeholder: "e.g. 1830",
                    min_length: 3,
                    max_length: 4,
                  },
                ],
              },
            ],
          });
        }
        flow.success();
        return;
      }

      // 🔹 Step: hour (modal)
      if ("isModalSubmit" in interaction && interaction.isModalSubmit() && payload?.step === "hour") {
        const eventType = payload.type;
        const eventName = payload.name;
        const dayValue = payload.day;

        const hourValue = interaction.fields.getTextInputValue("event_hour");
        if (!hourValue) throw new Error("event_hour_missing");

        // Tutaj w przyszłości można zapisać event do bazy lub innego systemu
        if ("reply" in interaction) {
          await interaction.reply({
            content: `✅ Event **${eventName}** scheduled on **${dayValue}** at **${hourValue} UTC**`,
            ephemeral: true,
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

function formatEventName(value: string) {
  return value
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDayLabel(value: string) {
  const [, month, day] = value.split("-").map(Number);
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

async function proceedToDaySelect(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  eventType: string,
  eventName: string
) {
  const allDays = getFutureDays(); // wszystkie dni jakie daje funkcja
  const days = allDays.slice(0, 8); // 8 przycisków: dzisiaj + 7 następnych

  const rows: any[] = [];
  for (let i = 0; i < days.length; i += 4) {
    rows.push({
      type: 1,
      components: days.slice(i, i + 4).map((d) => ({
        type: 2,
        label: formatDayLabel(d.value),
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