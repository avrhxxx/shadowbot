// src/index.ts
import { Client, GatewayIntentBits, Partials, Interaction } from "discord.js";
import { initTranslationModule } from "./modules/TranslationModule";
import { initModeratorPanel } from "./modules/ModeratorPanel";
import { handleEventInteraction } from "./events/eventHandlers"; // ✅ POPRAWIONE

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

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user?.tag}`);

  // Root panel i moduły
  initTranslationModule(client);
  initModeratorPanel(client);

  // Globalny listener event panelu
  client.on("interactionCreate", async (interaction: Interaction) => {
    await handleEventInteraction(interaction);
  });
});

client.login(BOT_TOKEN);