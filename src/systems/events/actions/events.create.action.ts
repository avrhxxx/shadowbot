// 📁 src/systems/events/actions/events.create.action.ts

import { registerUIAction } from "@/ui/core/uiRouter";
import { createLogger } from "@/foundation/logger";
import { getFutureDays } from "../utils/dateUtils";
import { renderView } from "@/ui/core/uiEngine";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// =====================================
// 🔹 HELPER FUNCTIONS
// =====================================

function formatEventType(value: string) {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDayLabel(value: string) {
  const [, month, day] = value.split("-").map(Number); // TS: year unused
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

async function renderEventTypeView(interaction: any, ctx: any) {
  const typeOptions = [
    "reservoir_raid",
    "arcadian_conquest",
    "city_contest",
    "ghoulion_pursuit",
    "birthdays",
    "custom",
  ];

  const rows: any[] = [];
  for (let i = 0; i < typeOptions.length; i += 5) {
    rows.push({
      type: 1,
      components: typeOptions.slice(i, i + 5).map((opt) => ({
        type: 2,
        label: formatEventType(opt),
        style: 1,
        custom_id: `events.create|step=type|type=${opt}`,
      })),
    });
  }

  await interaction.reply({
    content: "Select event type:",
    components: rows,
    ephemeral: true,
  });
}

async function handleTypeStep(interaction: any, payload: any, ctx: any) {
  const { type } = payload;
  if (!type) throw new Error("event_type_missing");

  if (["custom", "birthdays"].includes(type)) {
    // modal do wpisania nazwy
    await interaction.showModal({
      custom_id: `events.create|step=name|type=${type}`,
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
    await renderDaySelection(interaction, type, formatEventType(type));
  }
}

async function handleNameStep(interaction: any, payload: any, ctx: any) {
  const eventType = payload.type;
  const eventName = interaction.fields.getTextInputValue("event_name");
  if (!eventName) throw new Error("event_name_missing");

  await renderDaySelection(interaction, eventType, eventName);
}

async function renderDaySelection(interaction: any, eventType: string, eventName: string) {
  const allDays = getFutureDays();
  const days = allDays.slice(0, 8); // dzisiaj + 7 dni

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

  // Back button
  rows.push({
    type: 1,
    components: [
      { type: 2, label: "⬅ Back", style: 2, custom_id: "moderator.open|target=hub" },
    ],
  });

  await interaction.update({
    content: `Select day for event **${eventName}**:`,
    components: rows,
  });
}

async function handleDayStep(interaction: any, payload: any, ctx: any) {
  const { type, name, day } = payload;
  if (!day) throw new Error("day_value_missing");

  await interaction.showModal({
    custom_id: `events.create|step=hour|type=${type}|name=${name}|day=${day}`,
    title: `Set Time for ${name}`,
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

async function handleHourStep(interaction: any, payload: any, ctx: any) {
  const { type, name, day } = payload;
  const hour = interaction.fields.getTextInputValue("event_hour");
  if (!hour) throw new Error("hour_missing");

  await interaction.reply({
    content: `✅ Event **${name}** scheduled on **${day}** at **${hour} UTC**.`,
    ephemeral: true,
  });
}

// =====================================
// 🔹 REGISTER UI ACTION
// =====================================

registerUIAction("events.create", {
  system: "events",
  handler: async (interaction, ctx, payload) => {
    const log = createLogger(ctx).flow("events.create");
    log.start();

    try {
      switch (payload?.step) {
        case "start":
          await renderEventTypeView(interaction, ctx);
          break;
        case "type":
          await handleTypeStep(interaction, payload, ctx);
          break;
        case "name":
          await handleNameStep(interaction, payload, ctx);
          break;
        case "day":
          await handleDayStep(interaction, payload, ctx);
          break;
        case "hour":
          await handleHourStep(interaction, payload, ctx);
          break;
        default:
          throw new Error("unknown_interaction_type");
      }

      log.success();
    } catch (err) {
      log.fail(err);
      if ("reply" in interaction) {
        await interaction.reply({ content: `❌ Failed: ${err}`, ephemeral: true }).catch(() => null);
      }
    }
  },
});