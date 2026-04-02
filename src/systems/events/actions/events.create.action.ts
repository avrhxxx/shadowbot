// =====================================
// 📁 src/systems/events/actions/events.create.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { createLogger } from "@/foundation/logger";
import { getFutureDays } from "../utils/dateUtils";

// =====================================
// 🔹 MONTH NAMES
// =====================================
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// =====================================
// 🔹 HELPERS
// =====================================
function formatDayLabel(d: { label?: string; value: string }) {
  const [year, month, day] = d.value.split("-").map(Number);
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

// =====================================
// 🔹 REGISTER CREATE EVENT ACTION
// =====================================
registerUIAction("events.create", {
  system: "events",

  handler: async (interaction: any, ctx: any, payload: any) => {
    const log = createLogger(ctx);
    const flow = log.flow("events.create");
    flow.start();

    try {
      // ======================
      // 🔹 STEP: start - wybór typu eventu
      // ======================
      if (interaction.isButton?.() && payload?.step === "start") {
        const typeOptions = [
          { label: "Reservoir Raid", value: "reservoir_raid" },
          { label: "Arcadian Conquest", value: "arcadian_conquest" },
          { label: "City Contest", value: "city_contest" },
          { label: "Ghoulion Pursuit", value: "ghoulion_pursuit" },
          { label: "Birthday", value: "birthdays" },
          { label: "Custom", value: "custom" },
        ];

        const rows = typeOptions.reduce((acc: any[], _, i) => {
          if (i % 5 === 0) acc.push({ type: 1, components: [] });
          acc[acc.length - 1].components.push({
            type: 2,
            label: typeOptions[i].label,
            style: 1,
            custom_id: `events.create|step=type|type=${typeOptions[i].value}`,
          });
          return acc;
        }, []);

        await interaction.reply?.({
          content: "Select event type:",
          components: rows,
          ephemeral: true,
        });
        flow.success();
        return;
      }

      // ======================
      // 🔹 STEP: type
      // ======================
      if (interaction.isButton?.() && payload?.step === "type") {
        const eventType = payload.type;
        if (!eventType) throw new Error("event_type_missing");

        // Dla custom i birthdays najpierw modal z nazwą
        if (["custom", "birthdays"].includes(eventType)) {
          if (interaction.showModal) {
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
                      label: "Event Name",
                      style: 1,
                      min_length: 3,
                      max_length: 100,
                    },
                  ],
                },
              ],
            });
          }
        } else {
          // standardowy event → od razu wybór dnia
          await proceedToDaySelect(interaction, eventType, eventType);
        }
        flow.success();
        return;
      }

      // ======================
      // 🔹 STEP: name (modal)
      // ======================
      if (interaction.isModalSubmit?.() && payload?.step === "name") {
        const eventType = payload.type;
        const eventName = interaction.fields?.getTextInputValue("event_name");
        if (!eventName) throw new Error("event_name_missing");

        await proceedToDaySelect(interaction, eventType, eventName);
        flow.success();
        return;
      }

      // ======================
      // 🔹 STEP: hour input (modal)
      // ======================
      if (interaction.isModalSubmit?.() && payload?.step === "hour") {
        const eventType = payload.type;
        const eventName = payload.name;
        const eventDay = payload.day;
        const hourInput = interaction.fields?.getTextInputValue("event_hour");

        await interaction.reply?.({
          content: `✅ Event **${eventName}** scheduled on **${formatDayLabel({ value: eventDay })}** at **${hourInput}**.`,
          ephemeral: true,
        });
        flow.success();
        return;
      }

      flow.fail(new Error("unknown_interaction_type"));
    } catch (err) {
      flow.fail(err);
      await interaction.reply?.({ content: `❌ Failed: ${err}`, ephemeral: true }).catch(() => null);
    }
  },
});

// =====================================
// 🔹 HELPER: proceed to day select
// =====================================
async function proceedToDaySelect(interaction: any, eventType: string, eventName: string) {
  const days = getFutureDays(7);

  const rows = days.reduce((acc: any[], _, i) => {
    if (i % 5 === 0) acc.push({ type: 1, components: [] });
    acc[acc.length - 1].components.push({
      type: 2,
      label: formatDayLabel(days[i]),
      style: 1,
      custom_id: `events.create|step=hour|type=${eventType}|name=${eventName}|day=${days[i].value}`,
    });
    return acc;
  }, []);

  // 🔹 Back button
  rows.push({
    type: 1,
    components: [
      { type: 2, label: "⬅ Back", style: 2, custom_id: "moderator.open|target=hub" },
    ],
  });

  await interaction.update?.({
    content: `Select day for event **${eventName}**:`,
    components: rows,
  });
}