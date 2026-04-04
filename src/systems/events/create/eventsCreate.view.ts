// =====================================
// 📁 src/systems/events/create/eventsCreate.view.ts
// =====================================

import type { TraceContext } from "@/trace";
import type { ViewResult } from "@/core/ui/uiEngine";
import { formatEventUTC, formatButtonDate } from "@/shared/utils/timeUtils";

const DAYS_TO_SHOW = 8;

export function eventsCreateView(): (ctx: TraceContext, state?: any) => ViewResult {
  return (_ctx: TraceContext, _state?: any) => {
    const STANDARD_EVENT_TYPES = [
      { label: "Arcadian Conquest", value: "AC" },
      { label: "City Contest", value: "CC" },
      { label: "Reservoir Raid", value: "RR" },
      { label: "Ghoulion Pursuit", value: "GP" },
      { label: "KvK", value: "KVK" },
    ] as const;

    const OTHER_EVENT_TYPES = [
      { label: "Birthday", value: "BD" },
      { label: "Custom", value: "C" },
    ] as const;

    const mapToButton = (t: { label: string; value: string }) => ({
      label: t.label,
      action: "events.create.selectType",
      state: { target: t.value },
      style: "primary" as const,
    });

    return {
      content: "📌 **Create Event**\n\nSelect an event type:",
      buttons: [
        ...STANDARD_EVENT_TYPES.map(mapToButton),
        ...OTHER_EVENT_TYPES.map(mapToButton),
      ],
    } as const;
  };
}

// 🔹 Widoki stepów

export function birthdayFormModal() {
  return {
    title: "🎉 Birthday Event",
    fields: [
      { type: "text", name: "nickname", label: "Nickname", placeholder: "Enter nickname", required: true },
      { type: "number", name: "day", label: "Day", min: 1, max: 31, required: true },
      { type: "number", name: "month", label: "Month", min: 1, max: 12, required: true },
      { type: "number", name: "hours", label: "Hours", min: 0, max: 23, required: true },
      { type: "number", name: "minutes", label: "Minutes", min: 0, max: 59, required: true },
    ],
    cancelAction: "events.create.backToMain",
  };
}

export function customEventFormView() {
  return {
    title: "📝 Custom Event",
    fields: [
      { type: "text", name: "name", label: "Event Name", placeholder: "Enter event name", required: true },
      { type: "number", name: "day", label: "Day", min: 1, max: 31, required: true },
      { type: "number", name: "month", label: "Month", min: 1, max: 12, required: true },
      { type: "number", name: "hours", label: "Hours", min: 0, max: 23, required: true },
      { type: "number", name: "minutes", label: "Minutes", min: 0, max: 59, required: true },
    ],
    cancelAction: "events.create.backToMain",
  };
}

export function selectDayView() {
  const today = new Date();
  const buttons = [];

  for (let i = 0; i < DAYS_TO_SHOW; i++) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i));
    const label = formatButtonDate(date.getUTCDate(), date.getUTCMonth() + 1);
    const action = `events.create.selectTime|day=${date.getUTCDate()}&month=${date.getUTCMonth() + 1}`;
    buttons.push({ label, action, style: "primary" });
  }

  buttons.push({ label: "⬅ Back", action: "events.create.start", style: "secondary" });

  return {
    content: "📅 **Select a day for your event:**",
    buttons,
  };
}

export function selectTimeView(day: number, month: number, eventName: string) {
  return {
    title: `⏰ Set time for **${eventName}** on ${day}/${month} UTC`,
    customId: `events.create.selectTime.submit|day=${day}&month=${month}&eventName=${encodeURIComponent(eventName)}`,
    fields: [
      { type: "number", name: "hours", label: "Hours (0-23, UTC)", min: 0, max: 23, required: true },
      { type: "number", name: "minutes", label: "Minutes (0-59, UTC)", min: 0, max: 59, required: true },
    ],
  };
}

export function submitEventView(day: number, month: number, hours: number, minutes: number, eventName: string) {
  const formatted = formatEventUTC(day, month, hours, minutes);

  const buttons = [
    { label: "Yes, create & Notify", action: `events.create.confirm|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=true&eventName=${encodeURIComponent(eventName)}`, style: "primary" },
    { label: "Yes, create without notification", action: `events.create.confirm|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=false&eventName=${encodeURIComponent(eventName)}`, style: "primary" },
    { label: "⬅ Back", action: `events.create.selectTime|day=${day}&month=${month}&eventName=${encodeURIComponent(eventName)}`, style: "secondary" },
  ];

  return { content: `✅ You are about to create the event **${eventName}** scheduled for **${formatted}**.\nDo you want to notify the channel?`, buttons };
}

export function confirmEventView(day: number, month: number, hours: number, minutes: number) {
  const formatted = formatEventUTC(day, month, hours, minutes);

  return {
    content: `✅ **Confirm Event**\n\nEvent date: **${formatted}**\n\nDo you want to notify the channel?`,
    buttons: [
      { label: "📢 Create & Notify", action: `events.create.submit|notify=true&day=${day}&month=${month}&hours=${hours}&minutes=${minutes}`, style: "danger" },
      { label: "✅ Create (silent)", action: `events.create.submit|notify=false&day=${day}&month=${month}&hours=${hours}&minutes=${minutes}`, style: "primary" },
      { label: "⬅ Back", action: `events.create.selectTime|day=${day}&month=${month}`, style: "secondary" },
      { label: "🏠 Menu", action: "events.create.backToMain", style: "secondary" },
    ],
  };
}