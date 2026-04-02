import { registerUIAction } from "@/ui/core/uiRouter";
import { createLogger } from "@/foundation/logger";
import { getFutureDays } from "../utils/dateUtils";
import { createEventInDB, notifyEvent } from "../eventService";

import type { ButtonInteraction, ModalSubmitInteraction } from "discord.js";

// 🔹 Rejestracja akcji events
export function registerEventActions() {
  registerUIAction("events.create", {
    system: "events",
    handler: async (interaction: ButtonInteraction | ModalSubmitInteraction, ctx, payload: any) => {
      const log = createLogger(ctx);
      const flow = log.flow("events.create");
      flow.start();

      try {
        // 🔹 START → wybór typu
        if (interaction.isButton && payload?.step === "start") {
          const typeOptions = [
            { label: "Custom", value: "custom" },
            { label: "Birthday", value: "birthdays" },
            { label: "Reservoir Raid", value: "reservoir_raid" },
            { label: "Arcadian Conquest", value: "arcadian_conquest" },
            { label: "City Contest", value: "city_contest" },
            { label: "Gohoolion Pursuit", value: "gohoolion_pursuit" },
          ];

          const rows: any[] = [];
          for (let i = 0; i < typeOptions.length; i += 5) {
            rows.push({
              type: 1,
              components: typeOptions.slice(i, i + 5).map(opt => ({
                type: 2,
                label: opt.label,
                style: 1,
                custom_id: `events.create|step=type|type=${opt.value}`,
              })),
            });
          }

          await interaction.reply({ content: "Select event type:", components: rows, ephemeral: true });
          flow.success();
          return;
        }

        // 🔹 TYPE → modal nazwy lub day select
        if (interaction.isButton && payload?.step === "type") {
          const eventType = payload.type;
          if (!eventType) throw new Error("event_type_missing");

          if (["custom", "birthdays"].includes(eventType)) {
            await interaction.showModal({
              custom_id: `events.create|step=name|type=${eventType}`,
              title: "Enter Event Name",
              components: [{
                type: 1,
                components: [{
                  type: 4,
                  custom_id: "event_name",
                  style: 1,
                  label: "Event Name",
                  min_length: 3,
                  max_length: 100,
                }],
              }],
            });
          } else {
            await proceedToDaySelect(interaction, eventType, eventType);
          }
          flow.success();
          return;
        }

        // 🔹 NAME → day select
        if (interaction.isModalSubmit() && payload?.step === "name") {
          const eventType = payload.type;
          const eventName = interaction.fields.getTextInputValue("event_name");
          if (!eventName) throw new Error("event_name_missing");
          await proceedToDaySelect(interaction, eventType, eventName);
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
}

// 🔹 Helpers
async function proceedToDaySelect(interaction: ButtonInteraction | ModalSubmitInteraction, eventType: string, eventName: string) {
  const days = getFutureDays(14);
  const rows: any[] = [];
  for (let i = 0; i < days.length; i += 5) {
    rows.push({
      type: 1,
      components: days.slice(i, i + 5).map(d => ({
        type: 2,
        label: d.label, // <- label zamiast display
        style: 1,
        custom_id: `events.create|step=day|type=${eventType}|name=${eventName}|day=${d.value}`,
      })),
    });
  }

  // 🔹 Back button
  rows.push({
    type: 1,
    components: [{ type: 2, label: "⬅ Back", style: 2, custom_id: "events.open|target=hub" }],
  });

  await interaction.update({ content: `Select day for event **${eventName}**:`, components: rows });
}