// src/quickadd/services/QuickAddDataProvider.ts

import { getEvents } from "../../eventsPanel/eventService";
import { getAllWeeks } from "../../pointsPanel/pointsService";

// =============================
// TYPES
// =============================
export interface SelectOption {
  label: string;
  value: string;
}

// =============================
// 🎯 EVENTS
// =============================
export async function getSelectableEvents(
  guildId: string
): Promise<SelectOption[]> {
  const events = await getEvents(guildId);

  const filtered = events.filter(
    (e) => e.status === "ACTIVE" || e.status === "PAST"
  );

  const sorted = filtered.sort((a, b) => {
    if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
    if (b.status === "ACTIVE" && a.status !== "ACTIVE") return 1;

    return b.createdAt - a.createdAt;
  });

  return sorted.slice(0, 25).map((event) => {
    const emoji = event.status === "ACTIVE" ? "🟢" : "⚪";

    return {
      label: `${emoji} ${event.name} (${event.day}.${event.month})`,
      value: `event:${event.id}`,
    };
  });
}

// =============================
// 💰 POINTS
// =============================
export async function getSelectableWeeks(): Promise<SelectOption[]> {
  const donations = await getAllWeeks("Donations");
  const duel = await getAllWeeks("Duel");

  const donationOptions = donations.map((week) => ({
    label: `💰 Donations – ${week}`,
    value: `donations:${week}`,
  }));

  const duelOptions = duel.map((week) => ({
    label: `⚔️ Duel – ${week}`,
    value: `duel:${week}`,
  }));

  return [...donationOptions, ...duelOptions].slice(0, 25);
}