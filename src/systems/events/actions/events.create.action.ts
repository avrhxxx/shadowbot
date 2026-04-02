// =====================================
// 📁 src/systems/events/actions/events.create.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

// =====================================
// 🔹 HELPERS
// =====================================

function formatEventName(type: string) {
  return type
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

// Dummy functions to simulate next steps
async function proceedToDaySelect(interaction: any, type: string, name: string) {
  if ("reply" in interaction) {
    await interaction.reply({
      content: `Next step: pick day for "${name}"`,
      ephemeral: true,
    }).catch(() => null);
  }
}

// =====================================
// 🔹 REGISTER ACTION
// =====================================

registerUIAction("events.create", {
  system: "events",

  handler: async (interaction: any, ctx: TraceContext, payload: any) => {
    const log = createLogger(ctx);
    const flow = log.flow("events.create");
    flow.start();

    try {
      // ======================
      // 🔘 BUTTON: START STEP
      // ======================
      if (interaction.isButton?.() && payload?.step === "start") {
        flow.stepDebug("step.start");
        flow.success();
        return;
      }

      // ======================
      // 🔘 BUTTON: TYPE STEP
      // ======================
      if (interaction.isButton?.() && payload?.step === "type") {
        const typeValue = payload?.type;
        if (!typeValue) throw new Error("event_type_missing");

        const eventName = formatEventName(typeValue);

        if (["custom", "birthdays"].includes(typeValue)) {
          if (interaction.showModal) {
            await interaction.showModal({
              custom_id: `events.create|step=name|type=${typeValue}`,
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
          await proceedToDaySelect(interaction, typeValue, eventName);
        }

        flow.success();
        return;
      }

      // ======================
      // 🔘 MODAL: NAME STEP
      // ======================
      if (interaction.isModalSubmit?.() && payload?.step === "name") {
        const typeValue = payload?.type;
        if (!typeValue) throw new Error("event_type_missing");

        const eventName = interaction.fields?.getTextInputValue("event_name");
        if (!eventName) throw new Error("event_name_missing");

        await proceedToDaySelect(interaction, typeValue, eventName);
        flow.success();
        return;
      }

      // ======================
      // 🔘 BUTTON: DAY STEP
      // ======================
      if (interaction.isButton?.() && payload?.step === "day") {
        const typeValue = payload?.type;
        const eventName = payload?.name;
        const day = payload?.day;

        if (!typeValue || !eventName || !day) throw new Error("missing_day_payload");

        if (interaction.showModal) {
          await interaction.showModal({
            custom_id: `events.create|step=hour|type=${typeValue}|name=${eventName}|day=${day}`,
            title: `Select Hour for ${eventName}`,
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 4,
                    custom_id: "event_hour",
                    style: 1,
                    label: "Hour (HH:mm)",
                    min_length: 4,
                    max_length: 5,
                  },
                ],
              },
            ],
          });
        }

        flow.success();
        return;
      }

      // ======================
      // 🔘 MODAL: HOUR STEP
      // ======================
      if (interaction.isModalSubmit?.() && payload?.step === "hour") {
        const typeValue = payload?.type;
        const eventName = payload?.name;
        const day = payload?.day;

        if (!typeValue || !eventName || !day) throw new Error("missing_hour_payload");

        const hour = interaction.fields?.getTextInputValue("event_hour");
        if (!hour) throw new Error("hour_missing");

        if ("reply" in interaction) {
          await interaction.reply({
            content: `✅ Event created: ${eventName} (${typeValue}) on ${day} at ${hour}`,
            ephemeral: true,
          }).catch(() => null);
        }

        flow.success();
        return;
      }

      // ======================
      // 🔘 NIEOBSŁUGIWANE
      // ======================
      flow.stepWarn("unknown_interaction_type");
      if ("reply" in interaction) {
        await interaction.reply({ content: "⚠️ Unknown interaction", ephemeral: true }).catch(() => null);
      }
    } catch (err) {
      flow.fail(err);
      if ("reply" in interaction) {
        await interaction.reply({ content: `❌ Failed: ${err}`, ephemeral: true }).catch(() => null);
      }
    }
  },
});