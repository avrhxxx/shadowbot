import { Client, GatewayIntentBits, Partials } from "discord.js";
import { initTranslationModule } from "./modules/TranslationModule";
import { initEventPanel } from "./events/eventPanel"; // <-- tutaj initEventPanel

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
initEventPanel(client); // <-- inicjalizacja EventModule (panel + interakcje)

client.once("ready", () => console.log(`Logged in as ${client.user?.tag}`));

client.login(BOT_TOKEN);