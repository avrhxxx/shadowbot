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
    // TEST: Wstrzykujemy Birthday w 5 minut
    // -----------------------------
    const now = new Date();
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60_000);

    const tempId = `E-test-${Date.now()}`;
    const tempBirthday: TempEventData = {
      id: tempId,
      guildId: guild.id,
      name: "TestPlayer",           // nick z gry jubilanta
      day: fiveMinutesLater.getUTCDate(),
      month: fiveMinutesLater.getUTCMonth() + 1,
      hour: fiveMinutesLater.getUTCHours(),
      minute: fiveMinutesLater.getUTCMinutes(),
      eventType: "birthdays",
      reminderBefore: 0,            // wysyła od razu
    };

    tempEventStore.set(tempId, tempBirthday);
    console.log(`Injected test birthday for guild ${guild.id}, event in 5 minutes`);
  }

  client.on("interactionCreate", async (interaction: Interaction) => {
    await handleEventInteraction(interaction);
  });
});

client.login(BOT_TOKEN);