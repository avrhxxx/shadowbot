// =====================================
// 📁 src/systems/events/views/events.view.ts
// =====================================

import type { ViewResult } from "@/systems/moderator/views/moderator.view";

// ==========================
// 🔹 HELPER: CREATE ROWS
// ==========================
function createRows(buttons: any[]): any[] {
  const rows: any[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({ type: 1, components: buttons.slice(i, i + 5) });
  }
  return rows;
}

// ==========================
// 🧠 MAIN EVENTS VIEW
// ==========================
export async function renderEventsMain(): Promise<ViewResult> {
  const content = "📌 **Event Panel**";

  const buttons: any[] = [
    { type: 2, label: "Create Event", style: 1, custom_id: "events.action|type=create" },
    { type: 2, label: "Events List", style: 1, custom_id: "events.action|type=list" },
    { type: 2, label: "Manual Reminder", style: 1, custom_id: "events.action|type=reminder" },
    { type: 2, label: "Show All", style: 1, custom_id: "events.action|type=showAll" },
    { type: 2, label: "Cancel Event", style: 4, custom_id: "events.action|type=cancel" },
    { type: 2, label: "Guide", style: 3, custom_id: "events.action|type=help" },
    { type: 2, label: "Settings", style: 2, custom_id: "events.action|type=settings" },
  ];

  // 🔹 Back button
  buttons.push({
    type: 2,
    label: "⬅ Back",
    style: 2,
    custom_id: "moderator.open|target=hub",
  });

  return { content, components: createRows(buttons) };
}

// ==========================
// 🧠 CREATE EVENT VIEW
// ==========================
export async function renderCreateEventView(): Promise<ViewResult> {
  const content = "📝 **Create Event**\nSelect event type and date, then submit.";

  // 🔹 Event types (birthday and custom require manual name entry)
  const eventTypes = [
    { label: "Birthday", value: "birthdays" },
    { label: "Custom", value: "custom" },
    { label: "Reservoir Raid", value: "reservoir_raid" },
    { label: "Arcadian Conquest", value: "arcadian_conquest" },
    { label: "City Contest", value: "city_contest" },
    { label: "Gohoolion Pursuit", value: "gohoolion_pursuit" },
  ];

  const typeSelect = {
    type: 3, // StringSelectMenu
    custom_id: "events.create|step=type",
    placeholder: "Select event type",
    options: eventTypes,
  };

  // 🔹 Date select (user can pick day wprzód np. +7 dni)
  const dayOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      value: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
    };
  });

  const daySelect = {
    type: 3,
    custom_id: "events.create|step=day",
    placeholder: "Select event day",
    options: dayOptions,
  };

  // 🔹 Buttons
  const buttons: any[] = [
    { type: 2, label: "Submit Event", style: 1, custom_id: "events.action|type=createSubmit" },
    { type: 2, label: "Cancel", style: 4, custom_id: "events.back" },
  ];

  const rows = [
    { type: 1, components: [typeSelect] },
    { type: 1, components: [daySelect] },
    ...createRows(buttons),
  ];

  return { content, components: rows };
}

// ==========================
// 🧠 EVENTS LIST VIEW
// ==========================
export async function renderEventsListView(events: any[] = []): Promise<ViewResult> {
  const content = events.length
    ? `📅 **Events List**\n\n${events
        .map((e) => `• ${e.name} — ${e.day}/${e.month} ${e.hour}:${e.minute} UTC`)
        .join("\n")}`
    : "📅 **Events List**\n\nNo events found.";

  const buttons: any[] = [
    { type: 2, label: "Back", style: 2, custom_id: "events.back" },
  ];

  return { content, components: createRows(buttons) };
}

// ==========================
// 🧠 MANUAL REMINDER VIEW
// ==========================
export async function renderManualReminderView(): Promise<ViewResult> {
  const content = "⏰ **Manual Reminder**\nSelect an event to send reminder for.";

  const buttons: any[] = [
    { type: 2, label: "Send Reminder", style: 1, custom_id: "events.action|type=sendReminder" },
    { type: 2, label: "Back", style: 2, custom_id: "events.back" },
  ];

  return { content, components: createRows(buttons) };
}

// ==========================
// 🧠 SHOW ALL / PARTICIPANTS VIEW
// ==========================
export async function renderShowAllView(events: any[] = []): Promise<ViewResult> {
  const content = events.length
    ? `📋 **All Events / Participants**\n\n${events
        .map(
          (e) =>
            `**${e.name}** — ${e.day}/${e.month} ${e.hour}:${e.minute} UTC\nParticipants:\n${
              e.participants?.length ? e.participants.join(", ") : "None"
            }\nAbsent:\n${e.absent?.length ? e.absent.join(", ") : "None"}`
        )
        .join("\n\n--------------------\n\n")}`
    : "📋 **All Events / Participants**\n\nNo events found.";

  const buttons: any[] = [
    { type: 2, label: "Back", style: 2, custom_id: "events.back" },
  ];

  return { content, components: createRows(buttons) };
}

// ==========================
// 🧠 SETTINGS VIEW
// ==========================
export async function renderSettingsView(channels: { label: string; value: string }[] = []): Promise<ViewResult> {
  const content = "⚙️ **Event Settings**\nSelect channels for notifications and downloads.";

  const notificationSelect = {
    type: 3, // StringSelectMenu
    custom_id: "event_settings_notification",
    placeholder: "Select notification channel",
    options: channels,
  };

  const downloadSelect = {
    type: 3,
    custom_id: "event_settings_download",
    placeholder: "Select download channel",
    options: channels,
  };

  const rows = [
    { type: 1, components: [notificationSelect] },
    { type: 1, components: [downloadSelect] },
    { type: 1, components: [{ type: 2, label: "Back", style: 2, custom_id: "events.back" }] },
  ];

  return { content, components: rows };
}