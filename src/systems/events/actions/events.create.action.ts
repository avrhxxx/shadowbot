// =====================================
// 📁 src/systems/events/actions/events.create.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { createLogger } from "@/foundation/logger";
import { getFutureDays } from "../utils/dateUtils";
import { formatEventUTC } from "@/shared/utils/timeUtils";

// =====================================
// 🔹 MONTH NAMES
// =====================================
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// =====================================
// 🔹 FORMATTER HELPERS
// =====================================
function formatDayLabel(d: { value: string }) {
  const [, month, day] = d.value.split("-").map(Number);
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

function formatEventName(name: string) {
  return name
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// 🔹 Universal Date Parser (for modal input)
function parseDateInput(input: string) {
  const cleaned = input.trim();

  // YYYYMMDD
  const ymd = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (ymd) return { day: parseInt(ymd[3]), month: parseInt(ymd[2]), year: parseInt(ymd[1]), hour: 0, minute: 0 };

  // DD/MM/YYYY lub DD-MM-YYYY
  const dmySep = cleaned.match(/^(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?$/);
  if (dmySep) {
    let year = dmySep[3] ? parseInt(dmySep[3]) : new Date().getUTCFullYear();
    if (year < 100) year += 2000;
    return { day: parseInt(dmySep[1]), month: parseInt(dmySep[2]), year, hour: 0, minute: 0 };
  }

  // DD MMM (optional YYYY) HH:mm
  const dmyText = cleaned.match(/^(\d{1,2})\s*([A-Za-z]{3,})\s*(\d{2,4})?\s*(\d{1,2}):?(\d{2})?$/);
  if (dmyText) {
    const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase().startsWith(dmyText[2].toLowerCase()));
    if (monthIndex === -1) return null;
    let year = dmyText[3] ? parseInt(dmyText[3]) : new Date().getUTCFullYear();
    if (year < 100) year += 2000;
    return {
      day: parseInt(dmyText[1]),
      month: monthIndex + 1,
      year,
      hour: dmyText[4] ? parseInt(dmyText[4]) : 0,
      minute: dmyText[5] ? parseInt(dmyText[5]) : 0,
    };
  }

  return null;
}

// 🔹 Adjust year if date passed
function adjustFutureYear(parsed: { day: number, month: number, year: number, hour: number, minute: number }) {
  const now = new Date();
  const dt = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, parsed.hour, parsed.minute));
  if (dt < now) dt.setUTCFullYear(dt.getUTCFullYear() + 1);
  return { ...parsed, year: dt.getUTCFullYear() };
}

// 🔹 Dummy function to send notification (implement yourself)
async function sendEventNotification(payload: any) {
  console.log("Sending notification for event:", payload);
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
          { label: "KvK", value: "kvk" },
          { label: "Birthday", value: "birthdays" },
          { label: "Custom", value: "custom" },
        ];

        const rows: any[] = [];
        for (let i = 0; i < typeOptions.length; i += 5) {
          rows.push({
            type: 1,
            components: typeOptions.slice(i, i + 5).map(opt => ({
              type: 2, label: opt.label, style: 1,
              custom_id: `events.create|step=type|type=${opt.value}`
            })),
          });
        }
        rows.push({ type: 1, components: [{ type: 2, label: "⬅ Back", style: 2, custom_id: "moderator.open|target=hub" }] });

        await interaction.reply?.({ content: "Select event type:", components: rows, ephemeral: true });
        flow.success(); return;
      }

      // 🔹 Step: type
      if (interaction.isButton?.() && payload?.step === "type") {
        const eventType = payload.type; if (!eventType) throw new Error("event_type_missing");

        if (["custom","birthdays"].includes(eventType)) {
          await interaction.showModal?.({
            custom_id: `events.create|step=modal|type=${eventType}`,
            title: "Enter Event Details",
            components: [
              { type: 1, components: [{ type: 4, custom_id: "event_name", style: 1, label: "Event Name", min_length: 3, max_length: 100 }] },
              { type: 1, components: [{ type: 4, custom_id: "event_date", style: 1, label: "Event Date (YYYYMMDD / DD MMM / DD/MM)", min_length: 4, max_length: 20 }] },
              { type: 1, components: [{ type: 4, custom_id: "event_hour", style: 1, label: "Hour (HH:mm)", min_length: 4, max_length: 5 }] },
            ],
          });
        } else {
          await renderDaySelection(interaction, eventType, formatEventName(eventType));
        }
        flow.success(); return;
      }

      // 🔹 Step: modal submit dla Custom/Birthday
      if (interaction.isModalSubmit?.() && payload?.step === "modal") {
        const eventName = interaction.fields.getTextInputValue("event_name");
        const eventDateRaw = interaction.fields.getTextInputValue("event_date");
        const eventHourRaw = interaction.fields.getTextInputValue("event_hour");
        if (!eventName || !eventDateRaw || !eventHourRaw) throw new Error("missing_modal_fields");

        let parsedDate = parseDateInput(`${eventDateRaw} ${eventHourRaw}`);
        if (!parsedDate) throw new Error("invalid_date_format");
        parsedDate = adjustFutureYear(parsedDate);

        // 🔹 Formatuj datę do wyświetlenia (UTC)
        const formattedDate = formatEventUTC(parsedDate.day, parsedDate.month, parsedDate.hour, parsedDate.minute, parsedDate.year);

        await interaction.reply?.({
          content: `✅ Event **${eventName}** scheduled on **${formattedDate}**.\nDo you want to send a notification?`,
          components: [
            { type: 1, components: [
              { type: 2, label: "Yes", style: 3, custom_id: `events.create|step=notify|type=${payload.type}|name=${eventName}|date=${parsedDate.day}-${parsedDate.month}-${parsedDate.year}|hour=${parsedDate.hour}-${parsedDate.minute}` },
              { type: 2, label: "No", style: 2, custom_id: `events.create|step=cancel|name=${eventName}` },
            ] },
          ],
          ephemeral: true,
        });
        flow.success(); return;
      }

      // 🔹 Step: day selection dla standardowych eventów
      if (interaction.isButton?.() && payload?.step === "day") {
        const eventName = payload.name; const eventType = payload.type; const eventDay = payload.day;
        if (!eventName || !eventType || !eventDay) throw new Error("missing_day_payload");

        await interaction.showModal?.({
          custom_id: `events.create|step=hour|type=${eventType}|name=${eventName}|day=${eventDay}`,
          title: `Select Hour for ${eventName}`,
          components: [{ type: 1, components: [{ type: 4, custom_id: "event_hour", style: 1, label: "Hour (HH:mm)", min_length: 4, max_length: 5 }] }],
        });
        flow.success(); return;
      }

      // 🔹 Step: hour input dla standardowych eventów
      if (interaction.isModalSubmit?.() && payload?.step === "hour") {
        const eventName = payload.name; const eventDay = payload.day; 
        const hourInput = interaction.fields.getTextInputValue("event_hour");
        const [day, month] = eventDay.split("-").map(Number);
        const [hour, minute] = hourInput.split(":").map(Number);

        const formattedDate = formatEventUTC(day, month, hour, minute);

        await interaction.reply?.({
          content: `✅ Event **${eventName}** scheduled on **${formattedDate}**.\nDo you want to send a notification?`,
          components: [
            { type: 1, components: [
              { type: 2, label: "Yes", style: 3, custom_id: `events.create|step=notify|type=${payload.type}|name=${eventName}|day=${eventDay}|hour=${hourInput}` },
              { type: 2, label: "No", style: 2, custom_id: `events.create|step=cancel|name=${eventName}` },
            ] },
          ],
          ephemeral: true,
        });
        flow.success(); return;
      }

      // 🔹 Step: notify / cancel dla finalnego potwierdzenia
      if (interaction.isButton?.() && ["notify","cancel"].includes(payload?.step)) {
        const eventName = payload.name;
        if (payload.step === "notify") {
          await sendEventNotification(payload);
          await interaction.update?.({
            content: `✅ Event **${eventName}** created and notification sent!`,
            components: [],
          });
        } else {
          await interaction.update?.({
            content: `❌ Event **${eventName}** created without notification.`,
            components: [],
          });
        }
        flow.success(); return;
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
      components: days.slice(i, i + 5).map(d => ({
        type: 2, label: formatDayLabel(d), style: 1,
        custom_id: `events.create|step=day|type=${eventType}|name=${eventName}|day=${d.value}`,
      })),
    });
  }
  rows.push({ type: 1, components: [{ type: 2, label: "⬅ Back", style: 2, custom_id: "events.create|step=start" }] });

  await interaction.update?.({
    content: `Select day for event **${eventName}**:`,
    components: rows,
  });
}