// =====================================
// 📁 src/systems/events/core/event.service.ts
// =====================================

import type { TempEvent } from "../store/create/events.create.store";

/**
 * Zapisuje event do bazy danych (stub).
 */
export async function saveEventToDB(event: TempEvent): Promise<void> {
  console.log("saveEventToDB called", event);
  // TODO: implement actual DB save
}

/**
 * Wysyła powiadomienie o evencie (stub).
 */
export async function sendNotification(event: TempEvent): Promise<void> {
  console.log("sendNotification called", event);
  // TODO: implement actual notification logic
}