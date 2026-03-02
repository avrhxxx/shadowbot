// src/events/eventService.ts
import { EventData, loadEvents, saveEvents } from "./eventStorage";

export function addEvent(event: EventData) {
    const events = loadEvents();
    events.push(event);
    saveEvents(events);
}

export function getUpcomingEvents(): EventData[] {
    const now = Date.now();
    return loadEvents().filter(e => e.timestamp > now).sort((a, b) => a.timestamp - b.timestamp);
}

export function findEventById(id: string): EventData | undefined {
    return loadEvents().find(e => e.id === id);
}

export function updateEvent(event: EventData) {
    const events = loadEvents();
    const index = events.findIndex(e => e.id === event.id);
    if (index !== -1) {
        events[index] = event;
        saveEvents(events);
    }
}