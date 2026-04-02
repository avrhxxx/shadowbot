// =====================================
// 📁 src/systems/events/actions/events.create.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { createLogger } from "@/foundation/logger";
import { getFutureDays } from "../utils/dateUtils";
import { createEventInDB, notifyEvent } from "../eventService";

import type { Interaction, ButtonInteraction, ModalSubmitInteraction } from "discord.js";

// 🔹 REGISTER ACTION
registerUIAction("events.create", {
  system: "events",

  handler: async (interaction: Interaction, ctx, payload: any) => {
    const log = createLogger(ctx);
    const flow = log.flow("events.create");
    flow.start();

    try {
      // 🔹 Krok: Typ eventu
      if (interaction.isButton?.() && payload?.step === "start") {
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

        await (interaction as ButtonInteraction).reply({
          content: "Select event type:",
          components: rows,
          ephemeral: true,
        });
        flow.success();
        return;
      }

      // 🔹 Krok: Po wybraniu typu
      if (interaction.isButton?.() && payload?.step === "type") {
        const eventType = payload.type;
        if (!eventType) throw new Error("event_type_missing");

        // 🔹 Sprawdzenie, czy potrzebna nazwa
        if (["custom", "birthdays"].includes(eventType)) {
          await (interaction as ButtonInteraction).showModal({
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
        } else {
          // 🔹 Standard event → nazwa = typ
          await proceedToDaySelect(interaction as ButtonInteraction, eventType, eventType);
        }
        flow.success();
        return;
      }

      // 🔹 Krok: Modal nazwy eventu
      if (interaction.isModalSubmit?.() && payload?.step === "name") {
        const eventType = payload.type;
        const eventName = (interaction as ModalSubmitInteraction).fields.getTextInputValue("event_name");

        if (!eventName) throw new Error("event_name_missing");

        await proceedToDaySelect(interaction as ModalSubmitInteraction, eventType, eventName);
        flow.success();
        return;
      }

      // 🔹 Krok: Modal godziny i minut
      if (interaction.isModalSubmit?.() && payload?.step === "time") {
        const { eventType, eventName, day } = payload;
        const hourStr = (interaction as ModalSubmitInteraction).fields.getTextInputValue("event_hour");
        const minuteStr = (interaction as ModalSubmitInteraction).fields.getTextInputValue("event_minute");

        const hour = parseInt(hourStr);
        const minute = parseInt(minuteStr);

        if (isNaN(hour) || isNaN(minute)) throw new Error("invalid_time");

        await confirmEvent(interaction as ButtonInteraction | ModalSubmitInteraction, { eventType, eventName, day, hour, minute });
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

// 🔹 HELPERS

async function proceedToDaySelect(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  eventType: string,
  eventName: string
) {
  const days = getFutureDays(14);

  const rows: any[] = [];
  for (let i = 0; i < days.length; i += 5) {
    rows.push({
      type: 1,
      components: days.slice(i, i + 5).map(d => ({
        type: 2,
        label: d.label,
        style: 1,
        custom_id: `events.create|step=day|type=${eventType}|name=${eventName}|day=${d.value}`,
      })),
    });
  }

  rows.push({
    type: 1,
    components: [
      { type: 2, label: "⬅ Back", style: 2, custom_id: "events.open|target=hub" },
    ],
  });

  await (interaction as ButtonInteraction | ModalSubmitInteraction).update({
    content: `Select day for event **${eventName}**:`,
    components: rows,
  });
}

async function confirmEvent(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  { eventType, eventName, day, hour, minute }: any
) {
  const content = `📌 **Confirm Event**
Name: ${eventName}
Type: ${eventType}
Date: ${day} ${hour}:${minute} UTC
`;

  const rows: any[] = [
    {
      type: 1,
      components: [
        {
          type: 2,
          label: "Create & Notify",
          style: 1,
          custom_id: `events.create|step=final|type=${eventType}|name=${eventName}|day=${day}|hour=${hour}|minute=${minute}|notify=true`,
        },
        {
          type: 2,
          label: "Create Only",
          style: 2,
          custom_id: `events.create|step=final|type=${eventType}|name=${eventName}|day=${day}|hour=${hour}|minute=${minute}|notify=false`,
        },
        {
          type: 2,
          label: "⬅ Back",
          style: 2,
          custom_id: "events.open|target=hub",
        },
      ],
    },
  ];

  await (interaction as ButtonInteraction | ModalSubmitInteraction).update({ content, components: rows });
}

// 🔹 Final step: zapis do DB i powiadomienie
registerUIAction("events.create.final", {
  system: "events",
  handler: async (interaction: Interaction, ctx, payload: any) => {
    const log = createLogger(ctx);
    const flow = log.flow("events.create.final");
    flow.start();

    try {
      const { eventType, eventName, day, hour, minute, notify } = payload;
      await createEventInDB({ eventType, eventName, day, hour, minute });

      if (notify === "true") {
        await notifyEvent({ eventType, eventName, day, hour, minute });
      }

      await (interaction as ButtonInteraction | ModalSubmitInteraction).update({
        content: `✅ Event **${eventName}** created!`,
        components: [],
      });

      flow.success();
    } catch (err) {
      flow.fail(err);
      await interaction.reply?.({ content: `❌ Failed to create event: ${err}`, ephemeral: true }).catch(() => null);
    }
  },
});