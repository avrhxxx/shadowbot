// src/index.ts
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { initTranslationModule } from "./modules/TranslationModule";
import { initEventModule } from "./modules/EventModule"; // <-- import EventModule

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

// Inicjalizacja modułów
initTranslationModule(client);
initEventModule(client); // <-- tutaj inicjalizacja EventModule

client.once("clientReady", () => console.log(`Logged in as ${client.user?.tag}`));

client.login(BOT_TOKEN);