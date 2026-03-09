// 🔹 Import Google Sheets klienta jako pierwszy
import "./googleSheetsClient";

import { Client, GatewayIntentBits, Partials, Interaction, TextChannel } from "discord.js";
import { initTranslationModule } from "./modules/TranslationModule";
import { initModeratorPanel } from "./moderatorPanel/moderatorPanel";
import { handleEventInteraction } from "./eventsPanel/eventHandlers";
import { initEventReminders, sendBirthdayNotification } from "./eventsPanel/eventsButtons/eventsReminder";
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

    // 🔹 Test Birthday – wyślij powiadomienie po 1 minucie
    const testTempId = `E-test-birthday`;
    const testEvent: TempEventData = {
      id: testTempId,
      name: "TestPlayer",
      day: new Date().getUTCDate(),
      month: new Date().getUTCMonth() + 1,
      hour: new Date().getUTCHours(),
      minute: (new Date().getUTCMinutes() + 1) % 60, // minuta później
      guildId: guild.id,
      eventType: "birthdays"
    };

    tempEventStore.set(testTempId, testEvent);

    // Poczekaj minutę i wyślij powiadomienie
    setTimeout(async () => {
      const channel = guild.channels.cache.find(c => c.isTextBased()) as TextChannel | undefined;
      if (!channel) return;
      await sendBirthdayNotification(channel, testEvent);
      console.log(`Test birthday notification sent for ${testEvent.name} in ${guild.name}`);
    }, 60_000);
  }

  client.on("interactionCreate", async (interaction: Interaction) => {
    await handleEventInteraction(interaction);
  });
});

client.login(BOT_TOKEN);