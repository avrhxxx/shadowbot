// =====================================
// 📁 src/systems/events/create/events.create.store.ts
// =====================================

export type TempEvent = {
  id: string;
  userId: string;
  name?: string;
  type?: string;
  day?: number;
  month?: number;
  year?: number;
  hour?: number;
  minute?: number;
  createdAt: number;
};

const tempEventStore = new Map<string, TempEvent>();

export function createTempEvent(data: TempEvent) {
  tempEventStore.set(data.id, data);
}

export function getTempEvent(id: string, userId: string): TempEvent {
  const data = tempEventStore.get(id);
  if (!data) throw new Error("temp_event_not_found");
  if (data.userId !== userId) throw new Error("unauthorized_temp_access");
  return data;
}

export function updateTempEvent(id: string, userId: string, partial: Partial<TempEvent>) {
  const event = getTempEvent(id, userId);
  const updated = { ...event, ...partial };
  tempEventStore.set(id, updated);
  return updated;
}

export function deleteTempEvent(id: string, userId: string) {
  const event = getTempEvent(id, userId);
  tempEventStore.delete(id);
}