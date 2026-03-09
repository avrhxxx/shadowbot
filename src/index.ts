// 🔹 Import Google Sheets klienta jako pierwszy
import "./googleSheetsClient";

import { Client, GatewayIntentBits, Partials, Interaction } from "discord.js";
import { initTranslationModule } from "./modules/TranslationModule";
import { initModeratorPanel } from "./moderatorPanel/moderatorPanel";
import { handleEventInteraction } from "./eventsPanel/eventHandlers";
import { initEventReminders } from "./eventsPanel/eventsButtons/eventsReminder";
import { tempEventStore, TempEventData } from "./eventsPanel/eventsButtons/eventsCreateSubmit";

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

  initTranslationModule(client);
  initModeratorPanel(client);

  for (const guild of client.guilds.cache.values()) {
    initEventReminders(guild);

    // -----------------------------
    // TEST: Wstrzykujemy Birthday natychmiast
    // -----------------------------
    const now = new Date();

    const tempId = `E-test-${Date.now()}`;
    const tempBirthday: TempEventData = {
      id: tempId,
      guildId: guild.id,
      name: "TestPlayer",           // nick z gry jubilanta
      day: now.getUTCDate(),
      month: now.getUTCMonth() + 1,
      hour: now.getUTCHours(),
      minute: now.getUTCMinutes(),
      eventType: "birthdays",
      reminderBefore: 0,            // przypomnienie od razu
    };

    tempEventStore.set(tempId, tempBirthday);
    console.log(`Injected immediate test birthday for guild ${guild.id}`);
  }

  client.on("interactionCreate", async (interaction: Interaction) => {
    await handleEventInteraction(interaction);
  });
});

client.login(BOT_TOKEN);