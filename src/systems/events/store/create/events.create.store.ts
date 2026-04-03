// src/systems/events/store/create/events.create.store.ts
export type TempEvent = {
  id: string;
  userId: string;
  name: string;      // np. "Arcadian Conquest"
  type: string;      // standard/custom
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
  createdAt: number;
};

const store = new Map<string, TempEvent>();

export function createTempEvent(data: TempEvent) {
  store.set(data.id, data);
}

export function getTempEvent(id: string, userId: string) {
  const temp = store.get(id);
  if (!temp) throw new Error("temp_not_found");
  if (temp.userId !== userId) throw new Error("unauthorized_temp_access");
  return temp;
}

export function deleteTempEvent(id: string) {
  store.delete(id);
}