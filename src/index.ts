// src/index.ts
import { Client, GatewayIntentBits, Partials, Interaction } from "discord.js";
import { initTranslationModule } from "./modules/TranslationModule";
import { initModeratorPanel } from "./moderatorPanel/moderatorPanel";
import { handleEventInteraction } from "./eventsPanel/eventHandlers"; // nowa ścieżka
import { initEventReminders } from "./eventsPanel/eventsButtons/eventsReminder"; // dodane

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

client.once("ready", () => { // poprawione z "clientReady" na "ready"
  console.log(`Logged in as ${client.user?.tag}`);

  // Inicjalizacja modułów
  initTranslationModule(client);
  initModeratorPanel(client);

  // 🔹 Uruchamiamy interval reminderów dla wszystkich guildów
  for (const guild of client.guilds.cache.values()) {
    initEventReminders(guild);
  }

  // Globalny listener dla Event Panelu
  client.on("interactionCreate", async (interaction: Interaction) => {
    await handleEventInteraction(interaction);
  });
});

client.login(BOT_TOKEN);