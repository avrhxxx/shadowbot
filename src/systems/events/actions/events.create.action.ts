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
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// =====================================
// 🔹 FORMATTER HELPERS
// =====================================
function formatDayLabel(d: { value: string }) {
  const [, month, day] = d.value.split("-").map(Number);
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

// Snake case → Capitalized Words, np. reservoir_raid → Reservoir Raid
function formatEventName(name: string) {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// 🔹 Universal Date Parser (for modal input)
function parseDateInput(input: string) {
  const cleaned = input.trim();

  // YYYYMMDD
  const ymd = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (ymd) return { day: parseInt(ymd[3]), month: parseInt(ymd[2]), hour: 0, minute: 0 };

  // DD MMM YYYY HH:mm (optional)
  const dmy = cleaned.match(/^(\d{1,2})\s*([A-Za-z]{3,})\s*(\d{4})?\s*(\d{1,2}):?(\d{2})?$/);
  if (dmy) {
    const monthIndex = MONTH_NAMES.findIndex(
      (m) => m.toLowerCase().startsWith(dmy[2].toLowerCase())
    );
    if (monthIndex === -1) return null;
    return {
      day: parseInt(dmy[1]),
      month: monthIndex + 1,
      hour: dmy[4] ? parseInt(dmy[4]) : 0,
      minute: dmy[5] ? parseInt(dmy[5]) : 0,
    };
  }

  // DD/MM or DD-MM
  const simple = cleaned.match(/^(\d{1,2})[.\-/](\d{1,2})$/);
  if (simple) return { day: parseInt(simple[1]), month: parseInt(simple[2]), hour: 0, minute: 0 };

  return null;
}

// 🔹 Format Date Label for modal confirmation
function formatDateLabel(day: number, month: number, hour?: number, minute?: number) {
  let label = `${day} ${MONTH_NAMES[month - 1]}`;
  if (hour !== undefined && minute !== undefined) label += ` ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return label;
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
      // 🔹 Step: start - wybór typu eventu
      if (interaction.isButton?.() && payload?.step === "start") {
        const typeOptions = [
          { label: "Reservoir Raid", value: "reservoir_raid" },
          { label: "Arcadian Conquest", value: "arcadian_conquest" },
          { label: "City Contest", value: "city_contest" },
          { label: "Ghoulion Pursuit", value: "ghoulion_pursuit" },
          { label: "KvK", value: "kvk" }, // <-- Dodany brakujący event
          { label: "Birthday", value: "birthdays" },
          { label: "Custom", value: "custom" },
        ];

        const rows: any[] = [];
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

        rows.push({
          type: 1,
          components: [
            { type: 2, label: "⬅ Back", style: 2, custom_id: "moderator.open|target=hub" },
          ],
        });

        await interaction.reply?.({
          content: "Select event type:",
          components: rows,
          ephemeral: true,
        });
        flow.success();
        return;
      }

      // 🔹 Step: type
      if (interaction.isButton?.() && payload?.step === "type") {
        const eventType = payload.type;
        if (!eventType) throw new Error("event_type_missing");

        // Birthday i Custom: modal z nazwą, datą i godziną
        if (["custom", "birthdays"].includes(eventType)) {
          await interaction.showModal?.({
            custom_id: `events.create|step=modal|type=${eventType}`,
            title: "Enter Event Details",
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
              {
                type: 1,
                components: [
                  {
                    type: 4,
                    custom_id: "event_date",
                    style: 1,
                    label: "Event Date (YYYYMMDD / DD MMM)",
                    min_length: 4,
                    max_length: 20,
                  },
                ],
              },
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
        } else {
          await renderDaySelection(interaction, eventType, formatEventName(eventType));
        }
        flow.success();
        return;
      }

      // 🔹 Step: modal submit dla Custom/Birthday
      if (interaction.isModalSubmit?.() && payload?.step === "modal") {
        const eventName = interaction.fields.getTextInputValue("event_name");
        const eventDateRaw = interaction.fields.getTextInputValue("event_date");
        const eventHourRaw = interaction.fields.getTextInputValue("event_hour");

        if (!eventName || !eventDateRaw || !eventHourRaw) throw new Error("missing_modal_fields");

        const parsedDate = parseDateInput(`${eventDateRaw} ${eventHourRaw}`.trim());
        if (!parsedDate) throw new Error("invalid_date_format");

        const formattedDate = formatDateLabel(parsedDate.day, parsedDate.month, parsedDate.hour, parsedDate.minute);

        await interaction.reply?.({
          content: `✅ Event **${eventName}** scheduled on **${formattedDate}**.`,
          ephemeral: true,
        });
        flow.success();
        return;
      }

      // 🔹 Step: day selection dla standardowych eventów
      if (interaction.isButton?.() && payload?.step === "day") {
        const eventName = payload.name;
        const eventType = payload.type;
        const eventDay = payload.day;
        if (!eventName || !eventType || !eventDay) throw new Error("missing_day_payload");

        await interaction.showModal?.({
          custom_id: `events.create|step=hour|type=${eventType}|name=${eventName}|day=${eventDay}`,
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
        flow.success();
        return;
      }

      // 🔹 Step: hour input dla standardowych eventów
      if (interaction.isModalSubmit?.() && payload?.step === "hour") {
        const eventName = payload.name;
        const eventDay = payload.day;
        const hourInput = interaction.fields.getTextInputValue("event_hour");

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
// 🔹 HELPERS
// =====================================
async function renderDaySelection(interaction: any, eventType: string, eventName: string) {
  const days = getFutureDays(7);

  const rows: any[] = [];
  for (let i = 0; i < days.length; i += 5) {
    rows.push({
      type: 1,
      components: days.slice(i, i + 5).map((d) => ({
        type: 2,
        label: formatDayLabel(d),
        style: 1,
        custom_id: `events.create|step=day|type=${eventType}|name=${eventName}|day=${d.value}`,
      })),
    });
  }

  rows.push({
    type: 1,
    components: [
      { type: 2, label: "⬅ Back", style: 2, custom_id: "events.create|step=start" },
    ],
  });

  await interaction.update?.({
    content: `Select day for event **${eventName}**:`,
    components: rows,
  });
}