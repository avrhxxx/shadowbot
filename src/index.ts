import {
    Client,
    GatewayIntentBits,
    Partials,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Interaction
} from "discord.js";
import fetch from "node-fetch";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN is not defined");
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!process.env.LIBRE_URL) throw new Error("LIBRE_URL is not defined");

// =========================
// Languages
// =========================
const LANGUAGES = [
    { code: "en", label: "English", emoji: "🇬🇧" },
    { code: "pl", label: "Polish", emoji: "🇵🇱" },
    { code: "de", label: "German", emoji: "🇩🇪" },
    { code: "fr", label: "French", emoji: "🇫🇷" },
    { code: "ru", label: "Russian", emoji: "🇷🇺" }
];

// =========================
// Reaction Queue
// =========================
const reactionQueue: string[] = [];
let processingQueue = false;

async function processReactionQueue() {
    if (processingQueue) return;
    processingQueue = true;

    while (reactionQueue.length > 0) {
        const item = reactionQueue.shift();
        if (!item) continue;

        const [channelId, messageId] = item.split(":");

        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel || !channel.isTextBased()) continue;
            const message = await channel.messages.fetch(messageId);
            if (!message) continue;
            await message.react("🌐");
            await new Promise(res => setTimeout(res, 900));
        } catch (err) {
            console.error("Reaction queue error:", err);
        }
    }

    processingQueue = false;
}

// =========================
// Translators
// =========================
type TranslatorProvider = {
    name: string;
    translate: (text: string, target: string) => Promise<string>;
};

// LibreTranslate provider
const libreTranslate: TranslatorProvider = {
    name: "Libre",
    translate: async (text, target) => {
        const res = await fetch(process.env.LIBRE_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                q: text,
                source: "auto",
                target,
                format: "text"
            })
        });
        if (!res.ok) throw new Error(`Libre status: ${res.status}`);
        const data = (await res.json()) as { translatedText?: string };
        if (!data.translatedText) throw new Error("Libre returned no translation");
        return data.translatedText;
    }
};

// Google unofficial provider
const googleTranslate: TranslatorProvider = {
    name: "Google",
    translate: async (text, target) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Google status: ${res.status}`);
        const data = await res.json() as any;
        if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error("Google returned invalid format");
        return data[0].map((t: any) => t[0]).join("");
    }
};

const translators: TranslatorProvider[] = [libreTranslate, googleTranslate];

async function translateWithFallback(text: string, target: string): Promise<{ translated: string; provider: string }> {
    for (const provider of translators) {
        try {
            const translated = await provider.translate(text, target);
            return { translated, provider: provider.name };
        } catch (err) {
            console.warn(`${provider.name} failed:`, err);
        }
    }
    throw new Error("All translators failed");
}

// =========================
// Translation embeds
// =========================
const translationEmbeds = new Map<string, string>();

// =========================
// Ready
// =========================
client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

// =========================
// Auto reaction
// =========================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.inGuild()) return;
    reactionQueue.push(`${message.channelId}:${message.id}`);
    processReactionQueue();
});

// =========================
// Button interaction
// =========================
client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("translate_")) return;

    if (!interaction.channel || !interaction.channel.isTextBased()) {
        await interaction.reply({ content: "Channel not supported.", ephemeral: true });
        return;
    }

    const [_, messageId, langCode] = interaction.customId.split("_");

    let originalMessage;
    try {
        originalMessage = await interaction.channel.messages.fetch(messageId);
    } catch {
        await interaction.reply({ content: "Original message not found.", ephemeral: true });
        return;
    }

    let translatedText = "Translation failed.";
    let providerName = "none";

    try {
        const { translated, provider } = await translateWithFallback(originalMessage.content, langCode);
        translatedText = translated;
        providerName = provider;
    } catch {
        translatedText = "All translation services failed.";
    }

    try {
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Translation (${langCode.toUpperCase()})`)
                    .setAuthor({ name: originalMessage.author.username, iconURL: originalMessage.author.displayAvatarURL() })
                    .setDescription(`"${translatedText}"`)
                    .setFooter({ text: `Provider: ${providerName}` })
                    .setColor("Green")
            ],
            ephemeral: true
        });
    } catch (err) {
        console.error("Interaction reply error:", err);
    }
});

// =========================
// Start client
// =========================
client.login(BOT_TOKEN);