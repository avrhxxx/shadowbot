// src/quickadd/ui/eventSelectMenu.ts

import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { getEvents } from "../../eventsPanel/eventService";

export async function buildEventSelectMenu(guildId: string) {
  const events = await getEvents(guildId);

  if (!events || events.length === 0) return null;

  const options = events.slice(0, 25).map((event) => ({
    label: `${event.name} (${event.day}.${event.month})`,
    value: String(event.id), // 🔥 upewniamy się że to string
  }));

  const menu = new StringSelectMenuBuilder()
    .setCustomId("quickadd_select_event")
    .setPlaceholder("Select event")
    .addOptions(options);

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}