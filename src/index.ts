// 🔹 Import Google Sheets klienta jako pierwszy
import "./googleSheetsClient";

import { Client, GatewayIntentBits, Partials, Interaction, TextChannel } from "discord.js";
import { initTranslationModule } from "./modules/TranslationModule";
import { initModeratorPanel } from "./moderatorPanel/moderatorPanel";
import { handleEventInteraction } from "./eventsPanel/eventHandlers";
import { initEventReminders, sendBirthdayNotification } from "./eventsPanel/eventsButtons/eventsReminder";
import { EventObject } from "./eventsPanel/eventService";

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

client.once("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}`);

  // -----------------------------
  // Init modules
  // -----------------------------
  initTranslationModule(client);
  initModeratorPanel(client);

  // -----------------------------
  // Event reminders
  // -----------------------------
  for (const guild of client.guilds.cache.values()) {
    initEventReminders(guild);

    // -----------------------------
    // Test birthday – przyjdzie po 1 minucie
    // -----------------------------
    const channel = guild.channels.cache.find(c => c.isTextBased()) as TextChannel;
    if (channel) {
      const now = new Date();
      const testEvent: EventObject = {
        id: "test-bday",
        guildId: guild.id,
        name: "TestPlayer",
        day: now.getUTCDate(),
        month: now.getUTCMonth() + 1,
        hour: now.getUTCHours(),
        minute: (now.getUTCMinutes() + 1) % 60, // za minutę
        year: now.getUTCFullYear(),
        status: "ACTIVE",
        participants: [],
        absent: [],
        createdAt: Date.now(),
        reminderSent: false,
        started: false,
        reminderBefore: 0,
        eventType: "birthdays"
      };

      setTimeout(() => sendBirthdayNotification(channel, testEvent), 60_000);
    }
  }

  // -----------------------------
  // Interaction handler
  // -----------------------------
  client.on("interactionCreate", async (interaction: Interaction) => {
    await handleEventInteraction(interaction);
  });
});

client.login(BOT_TOKEN);