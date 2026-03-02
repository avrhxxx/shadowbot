import { Client, GatewayIntentBits, Partials } from "discord.js";
import { initTranslationModule } from "./modules/TranslationModule";
import { initModeratorPanel } from "./modules/ModeratorPanel";
// import Event Panel nie jest wywoływany globalnie, tylko po kliknięciu przycisku Event Menu

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

// Wywołujemy moduły dopiero po zalogowaniu
client.once("clientReady", () => {
  console.log(`Logged in as ${client.user?.tag}`);

  // Root panel i moduły
  initTranslationModule(client); // moduł placeholder
  initModeratorPanel(client);     // tworzy kanał + root panel + obsługa przycisków
});

client.login(BOT_TOKEN);