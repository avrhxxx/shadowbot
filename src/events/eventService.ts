// src/events/eventService.ts
import { eventStorage, StoredEvent } from "./eventStorage";
import { randomUUID } from "crypto";

export const eventService = {
  createEvent(data: {
    title: string;
    description: string;
    timestamp: number;
    channelId: string;
  }): StoredEvent {
    const newEvent: StoredEvent = {
      id: randomUUID(),
      title: data.title,
      description: data.description,
      timestamp: data.timestamp,
      channelId: data.channelId,
      participants: [],
      createdAt: Date.now(),
      cancelled: false,
    };

    const events = eventStorage.getAllEvents();
    events.push(newEvent);
    eventStorage.saveAllEvents(events);

    return newEvent;
  },

  listAllEvents(): StoredEvent[] {
    return eventStorage
      .getAllEvents()
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  listUpcomingEvents(): StoredEvent[] {
    const now = Date.now();
    return this.listAllEvents().filter(
      (e) => e.timestamp > now && !e.cancelled
    );
  },

  findById(id: string): StoredEvent | undefined {
    return eventStorage.getAllEvents().find((e) => e.id === id);
  },

  cancelEvent(id: string): boolean {
    const events = eventStorage.getAllEvents();
    const event = events.find((e) => e.id === id);
    if (!event) return false;

    event.cancelled = true;
    eventStorage.saveAllEvents(events);
    return true;
  },

  addParticipant(eventId: string, userId: string) {
    const events = eventStorage.getAllEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    if (!event.participants.includes(userId)) {
      event.participants.push(userId);
      eventStorage.saveAllEvents(events);
    }
  },

  removeParticipant(eventId: string, userId: string) {
    const events = eventStorage.getAllEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    event.participants = event.participants.filter(
      (id) => id !== userId
    );

    eventStorage.saveAllEvents(events);
  },
};