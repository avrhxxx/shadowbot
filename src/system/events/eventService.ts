// =====================================
// 📁 src/eventsPanel/eventService.ts
// =====================================

import { SheetRepository } from "../google/SheetRepository";
import crypto from "crypto";
import { log } from "../core/logger/log";
import { TraceContext } from "../core/trace/TraceContext";

// =============================
// TYPES
// =============================
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
  results: string[];
  absent: string[];
  createdAt: number;
  reminderSent: boolean;
  started: boolean;
  lastBirthdayYear?: number;
}

export interface EventConfig {
  id?: string;
  guildId: string;
  notificationChannel?: string;
  downloadChannel?: string;
  [key: string]: any;
}

// =============================
// REPOS
// =============================
const eventRepo = new SheetRepository<EventObject>("events");
const configRepo = new SheetRepository<EventConfig>("events_config");

// =============================
// 📥 LOAD (NO LOGS)
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
export async function createEvent(
  data: EventObject,
  ctx?: TraceContext
): Promise<EventObject> {
  const l = ctx ? log.ctx(ctx) : null;

  const newEvent: EventObject = {
    ...data,
    id: data.id ?? crypto.randomUUID(),
    participants: data.participants || [],
    results: data.results || [],
    absent: data.absent || [],
    reminderSent: data.reminderSent ?? false,
    started: data.started ?? false,
    createdAt: data.createdAt ?? Date.now(),
    year: data.year ?? new Date().getUTCFullYear(),
  };

  await eventRepo.create(newEvent);

  l?.event("event_create", {
    context: {
      eventId: newEvent.id,
      guildId: newEvent.guildId,
      type: newEvent.eventType,
    },
  });

  return newEvent;
}

// =============================
// ❌ DELETE
// =============================
export async function deleteEvent(
  eventId: string,
  ctx?: TraceContext
) {
  const l = ctx ? log.ctx(ctx) : null;

  const existing = await eventRepo.findById(eventId);

  if (!existing) {
    l?.warn("event_not_found", { eventId });
    return;
  }

  await eventRepo.deleteById(eventId);

  l?.event("event_delete", {
    context: {
      eventId,
      guildId: existing.guildId,
    },
  });
}

// =============================
// ✏️ UPDATE
// =============================
export async function updateEvent(
  eventId: string,
  partial: Partial<EventObject>,
  ctx?: TraceContext
) {
  const l = ctx ? log.ctx(ctx) : null;

  await eventRepo.updateById(eventId, partial);

  l?.event("event_update", {
    context: { eventId },
  });
}

// =============================
// 🔔 REMINDER
// =============================
export async function checkAndSetReminder(
  eventId: string,
  reminderValue: boolean,
  ctx?: TraceContext
): Promise<boolean> {
  const l = ctx ? log.ctx(ctx) : null;

  const event = await eventRepo.findById(eventId);

  if (!event) {
    l?.warn("event_not_found", { eventId });
    return false;
  }

  if (!event.reminderSent && reminderValue) {
    await eventRepo.updateById(eventId, { reminderSent: true });

    l?.event("event_reminder_set", {
      context: {
        eventId,
        guildId: event.guildId,
      },
    });

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
  nicknames: string[],
  ctx?: TraceContext
) {
  const l = ctx ? log.ctx(ctx) : null;

  const event = await getEventById(guildId, eventId);

  if (!event) {
    l?.warn("event_not_found", { eventId, guildId });
    throw new Error("Event not found");
  }

  const participants = [...event.participants];
  let absent = [...event.absent];

  for (const nick of nicknames) {
    if (!participants.includes(nick)) participants.push(nick);
    absent = absent.filter((n) => n !== nick);
  }

  await updateEvent(eventId, { participants, absent }, ctx);

  l?.event("event_participants_add", {
    context: {
      eventId,
      guildId,
      added: nicknames.length,
      total: participants.length,
    },
  });

  return participants;
}

export async function removeParticipants(
  guildId: string,
  eventId: string,
  nicknames: string[],
  ctx?: TraceContext
) {
  const l = ctx ? log.ctx(ctx) : null;

  const event = await getEventById(guildId, eventId);

  if (!event) {
    l?.warn("event_not_found", { eventId, guildId });
    throw new Error("Event not found");
  }

  const participants = event.participants.filter(
    (n) => !nicknames.includes(n)
  );

  const absent = event.absent.filter(
    (n) => !nicknames.includes(n)
  );

  await updateEvent(eventId, { participants, absent }, ctx);

  l?.event("event_participants_remove", {
    context: {
      eventId,
      guildId,
      removed: nicknames.length,
      total: participants.length,
    },
  });

  return participants;
}

export async function markAbsent(
  guildId: string,
  eventId: string,
  nicknames: string[],
  ctx?: TraceContext
) {
  const l = ctx ? log.ctx(ctx) : null;

  const event = await getEventById(guildId, eventId);

  if (!event) {
    l?.warn("event_not_found", { eventId, guildId });
    throw new Error("Event not found");
  }

  let participants = [...event.participants];
  let absent = [...event.absent];

  for (const nick of nicknames) {
    if (!participants.includes(nick)) continue;

    participants = participants.filter((n) => n !== nick);

    if (!absent.includes(nick)) {
      absent.push(nick);
    }
  }

  await updateEvent(eventId, { participants, absent }, ctx);

  l?.event("event_participants_absent", {
    context: {
      eventId,
      guildId,
      affected: nicknames.length,
      absentTotal: absent.length,
    },
  });

  return absent;
}

// =============================
// 🧠 RESULTS
// =============================
export async function addResults(
  guildId: string,
  eventId: string,
  nicknames: string[],
  ctx?: TraceContext
) {
  const l = ctx ? log.ctx(ctx) : null;

  const event = await getEventById(guildId, eventId);

  if (!event) {
    l?.warn("event_not_found", { eventId, guildId });
    throw new Error("Event not found");
  }

  const participants = [...event.participants];
  const resultsSet = new Set(event.results || []);

  for (const nick of nicknames) {
    if (!participants.includes(nick)) continue;
    resultsSet.add(nick);
  }

  const results = Array.from(resultsSet);

  const computedAbsent = participants.filter(
    (p) => !results.includes(p)
  );

  const absentSet = new Set([
    ...(event.absent || []),
    ...computedAbsent,
  ]);

  const absent = Array.from(absentSet);

  await updateEvent(eventId, { results, absent }, ctx);

  l?.event("event_results_add", {
    context: {
      eventId,
      guildId,
      resultsCount: results.length,
      absentCount: absent.length,
    },
  });

  return { results, absent };
}

// =============================
// 🚫 STATUS
// =============================
export async function cancelEvent(
  guildId: string,
  eventId: string,
  ctx?: TraceContext
): Promise<EventObject | null> {
  const l = ctx ? log.ctx(ctx) : null;

  const event = await getEventById(guildId, eventId);

  if (!event) {
    l?.warn("event_not_found", { eventId, guildId });
    return null;
  }

  await updateEvent(eventId, { status: "CANCELED" }, ctx);

  l?.event("event_cancel", {
    context: {
      eventId,
      guildId,
    },
  });

  return { ...event, status: "CANCELED" };
}

// =============================
// 💾 SAVE MANY
// =============================
export async function saveEvents(
  guildId: string,
  events: EventObject[],
  ctx?: TraceContext
) {
  const l = ctx ? log.ctx(ctx) : null;

  for (const event of events) {
    await updateEvent(
      event.id,
      {
        participants: event.participants,
        results: event.results,
        absent: event.absent,
        status: event.status,
        reminderSent: event.reminderSent,
        started: event.started,
        lastBirthdayYear:
          event.eventType === "birthdays"
            ? event.lastBirthdayYear ?? 0
            : undefined,
      },
      ctx
    );
  }

  l?.event("event_bulk_save", {
    context: {
      guildId,
      count: events.length,
    },
  });
}

// =============================
// ⚙️ CONFIG (NO LOGS)
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
  const existing = await configRepo.findAll({ guildId });

  if (!existing.length) {
    await configRepo.create({
      id: crypto.randomUUID(),
      guildId,
      [key]: value,
    });
    return;
  }

  await configRepo.updateById(existing[0].id!, {
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