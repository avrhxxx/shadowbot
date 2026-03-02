// src/index.ts
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { initTranslationModule } from "./modules/TranslationModule";
import { initModeratorPanel } from "./modules/ModeratorPanel";
import { initEventPanel } from "./events/eventPanel";

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

// Inicjalizacja modułów po zalogowaniu klienta
client.once("clientReady", () => {
    console.log(`Logged in as ${client.user?.tag}`);

    initTranslationModule(client);
    initModeratorPanel(client); // tworzy Moderation Panel + główny wybór przycisków
    initEventPanel(client);     // obsługuje Event Panel i wszystkie interakcje związane z eventami
});

client.login(BOT_TOKEN);