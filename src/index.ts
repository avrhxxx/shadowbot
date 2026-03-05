// src/index.ts
import { Client, GatewayIntentBits, Partials, Interaction } from "discord.js";
import { initTranslationModule } from "./modules/TranslationModule";
import { initModeratorPanel } from "./moderatorPanel/moderatorPanel";
import { handleEventInteraction } from "./eventsPanel/eventHandlers";
import { initEventReminders } from "./eventsPanel/eventsButtons/eventsReminder";
import { createEvent, saveEvents } from "./eventsPanel/eventService";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN not defined");
const BOT_TOKEN = process.env.BOT_TOKEN;

// 🔹 Delay helper
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// 🔹 Seedowanie eventów i uczestników (bezpiecznie)
async function seedEventsSafe(guildId: string) {
  const totalEvents = 20;
  const totalUsers = 50;

  const userIds = Array.from({ length: totalUsers }, (_, i) => `nick${i + 1}`);
  const events: any[] = [];

  for (let i = 1; i <= totalEvents; i++) {
    const event = await createEvent({
      guildId,
      name: `Event ${i}`,
      day: 5,
      month: 3,
      year: 2026,
      hour: 23,
      minute: 45
    });
    events.push(event);

    for (const userId of userIds) {
      event.participants.push(userId);

      if (!event.absent) event.absent = [];
      if (Math.random() < 0.3) event.absent.push(userId);

      await saveEvents(guildId, events);
      await delay(50); // 50ms przerwy między dodawaniem użytkowników
    }

    await delay(200); // przerwa między eventami
  }

  console.log(`✅ Safe seed finished: ${totalEvents} events × ${totalUsers} users`);
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}`);

  // 🔹 Inicjalizacja modułów
  initTranslationModule(client);
  initModeratorPanel(client);

  // 🔹 Uruchamiamy interval reminderów dla wszystkich guildów
  for (const guild of client.guilds.cache.values()) {
    initEventReminders(guild);

    // 🔹 Seedowanie testowych eventów
    seedEventsSafe(guild.id);
  }

  // 🔹 Globalny listener dla Event Panelu
  client.on("interactionCreate", async (interaction: Interaction) => {
    await handleEventInteraction(interaction);
  });
});

client.login(BOT_TOKEN);