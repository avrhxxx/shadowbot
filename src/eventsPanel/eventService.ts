// src/eventsPanel/eventService.ts
import { SheetRepository } from "../google/SheetRepository";

export interface EventObject {
  id: string;
  guildId: string;
  name: string;
  eventType: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  year: number;
  reminderBefore?: number;
  status: "ACTIVE" | "PAST" | "CANCELED";
  participants: string[];
  absent: string[];
  createdAt: number;
  reminderSent: boolean;
  started: boolean;
  lastBirthdayYear?: number;
}

export interface EventConfig {
  guildId: string;
  notificationChannel?: string;
  downloadChannel?: string;
  [key: string]: any;
}

// =============================
// 📦 REPOS
// =============================
const eventRepo = new SheetRepository<EventObject>("events");
const configRepo = new SheetRepository<EventConfig>("events_config");

// =============================
// 📥 LOAD
// =============================
export async function getEvents(guildId: string): Promise<EventObject[]> {
  return eventRepo.findAll({ guildId });
}

export async function getEventById(
  guildId: string,
  eventId: string
): Promise<EventObject | null> {
  const event = await eventRepo.findById(eventId);
  if (!event || event.guildId !== guildId) return null;
  return event;
}

// =============================
// ➕ CREATE
// =============================
export async function createEvent(data: EventObject): Promise<EventObject> {
  return eventRepo.create({
    ...data,
    participants: data.participants || [],
    absent: data.absent || [],
    reminderSent: data.reminderSent ?? false,
    started: data.started ?? false,
    createdAt: data.createdAt ?? Date.now(),
    year: data.year ?? new Date().getUTCFullYear(),
  });
}

// =============================
// ❌ DELETE
// =============================
export async function deleteEvent(eventId: string) {
  await eventRepo.deleteById(eventId);
}

// =============================
// ✏️ UPDATE
// =============================
export async function updateEvent(eventId: string, partial: Partial<EventObject>) {
  await eventRepo.updateById(eventId, partial);
}

// =============================
// 🔔 REMINDER
// =============================
export async function checkAndSetReminder(
  eventId: string,
  reminderValue: boolean
): Promise<boolean> {
  const event = await eventRepo.findById(eventId);
  if (!event) return false;

  if (!event.reminderSent && reminderValue) {
    await eventRepo.updateById(eventId, { reminderSent: true });
    return true;
  }

  return false;
}

// =============================
// 👥 PARTICIPANTS
// =============================
export async function addParticipants(
  guildId: string,
  eventId: string,
  nicknames: string[]
) {
  const event = await getEventById(guildId, eventId);
  if (!event) throw new Error("Event not found");

  const participants = [...event.participants];
  let absent = [...event.absent];

  for (const nick of nicknames) {
    if (!participants.includes(nick)) participants.push(nick);
    absent = absent.filter((n) => n !== nick);
  }

  await updateEvent(eventId, { participants, absent });

  return participants;
}

export async function removeParticipants(
  guildId: string,
  eventId: string,
  nicknames: string[]
) {
  const event = await getEventById(guildId, eventId);
  if (!event) throw new Error("Event not found");

  const participants = event.participants.filter(
    (n) => !nicknames.includes(n)
  );

  const absent = event.absent.filter(
    (n) => !nicknames.includes(n)
  );

  await updateEvent(eventId, { participants, absent });

  return participants;
}

export async function markAbsent(
  guildId: string,
  eventId: string,
  nicknames: string[]
) {
  const event = await getEventById(guildId, eventId);
  if (!event) throw new Error("Event not found");

  let participants = [...event.participants];
  let absent = [...event.absent];

  for (const nick of nicknames) {
    if (!participants.includes(nick)) continue;

    participants = participants.filter((n) => n !== nick);

    if (!absent.includes(nick)) {
      absent.push(nick);
    }
  }

  await updateEvent(eventId, { participants, absent });

  return absent;
}

// =============================
// 🚫 STATUS
// =============================
export async function cancelEvent(
  guildId: string,
  eventId: string
): Promise<EventObject | null> {
  const event = await getEventById(guildId, eventId);
  if (!event) return null;

  await updateEvent(eventId, { status: "CANCELED" });

  return { ...event, status: "CANCELED" };
}

// =============================
// 💾 SAVE MANY
// =============================
export async function saveEvents(
  guildId: string,
  events: EventObject[]
) {
  for (const event of events) {
    await updateEvent(event.id, {
      participants: event.participants,
      absent: event.absent,
      status: event.status,
      reminderSent: event.reminderSent,
      started: event.started,
      lastBirthdayYear:
        event.eventType === "birthdays"
          ? event.lastBirthdayYear ?? 0
          : undefined,
    });
  }
}

// =============================
// ⚙️ CONFIG
// =============================
export async function getConfig(
  guildId: string
): Promise<EventConfig> {
  const configs = await configRepo.findAll({ guildId });
  return configs[0] || { guildId };
}

export async function setConfig(
  guildId: string,
  key: string,
  value: any
) {
  const existing = await getConfig(guildId);

  if (!existing || !existing.guildId) {
    await configRepo.create({
      guildId,
      [key]: value,
    } as EventConfig);
    return;
  }

  await configRepo.updateById(existing.id!, {
    [key]: value,
  });
}

export async function setNotificationChannel(
  guildId: string,
  channelId: string
) {
  await setConfig(guildId, "notificationChannel", channelId);
}

export async function setDownloadChannel(
  guildId: string,
  channelId: string
) {
  await setConfig(guildId, "downloadChannel", channelId);
}