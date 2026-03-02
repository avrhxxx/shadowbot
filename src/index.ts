import {
    Client,
    GatewayIntentBits,
    Partials,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from "discord.js";
import fetch from "node-fetch";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN not defined");

// Endpointy do tłumaczenia
const TRANSLATORS = [
    process.env.LIBRE_URL || "https://libretranslate-production-26a3.up.railway.app/translate",
    process.env.GOOGLE_URL || "https://translate.googleapis.com/translate_a/single"
];

const LANGUAGES = [
    { code: "en", label: "English", emoji: "🇬🇧" },
    { code: "pl", label: "Polish", emoji: "🇵🇱" },
    { code: "de", label: "German", emoji: "🇩🇪" },
    { code: "fr", label: "French", emoji: "🇫🇷" },
    { code: "ru", label: "Russian", emoji: "🇷🇺" }
];

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
            if (!channel?.isTextBased()) continue;
            const message = await channel.messages.fetch(messageId);
            if (!message) continue;
            await message.react("🌍"); // zmiana reakcji na ziemię
            await new Promise(res => setTimeout(res, 900));
        } catch (err) { console.error("Reaction queue error:", err); }
    }
    processingQueue = false;
}

client.once("ready", () => console.log(`Logged in as ${client.user?.tag}`));

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.inGuild()) return;
    reactionQueue.push(`${message.channelId}:${message.id}`);
    processReactionQueue();
});

const translationEmbeds = new Map<string, string>();

client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.emoji.name !== "🌍" || !reaction.message.inGuild()) return;

    const message = reaction.message;
    if (translationEmbeds.has(message.id)) return;

    const embed = new EmbedBuilder()
        .setTitle("Translation Panel")
        .setAuthor({ name: message.author.username, iconURL: "https://cdn-icons-png.flaticon.com/512/684/684908.png" })
        .setDescription(`"${message.content}"`)
        .setColor("Blue")
        .setFooter({ text: "You have 60s to click a button" });

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < LANGUAGES.length; i += 5) {
        const row = new ActionRowBuilder<ButtonBuilder>();
        for (const lang of LANGUAGES.slice(i, i + 5)) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`translate_${message.id}_${lang.code}`)
                    .setLabel(lang.label)
                    .setEmoji(lang.emoji)
                    .setStyle(ButtonStyle.Primary)
            );
        }
        rows.push(row);
    }

    const sent = await message.channel.send({ embeds: [embed], components: rows });
    translationEmbeds.set(message.id, sent.id);

    let elapsed = 0;
    const interval = setInterval(async () => {
        elapsed += 10;
        if (!sent.editable || elapsed >= 60) {
            clearInterval(interval);
            try { await sent.delete(); } catch {}
            translationEmbeds.delete(message.id);
            return;
        }
        try { await sent.edit({ components: rows }); } catch {}
    }, 10000);
});

async function translateWithRotatingAPI(text: string, target: string) {
    for (const url of TRANSLATORS) {
        try {
            let body: any;
            let headers: any = { "Content-Type": "application/json" };
            if (url.includes("libretranslate")) {
                body = JSON.stringify({ q: text, source: "auto", target, format: "text" });
            } else {
                // Google nieoficjalne
                const params = new URLSearchParams({ client: "gtx", sl: "auto", tl: target, dt: "t", q: text });
                return await fetch(`${url}?${params.toString()}`)
                    .then(r => r.json())
                    .then(data => data[0][0][0]);
            }

            const res = await fetch(url, { method: "POST", headers, body });
            if (!res.ok) continue;
            const data = await res.json();
            if (data.translatedText) return data.translatedText;
        } catch (err) {
            console.warn(`Translator failed: ${url}`, err);
        }
    }
    return "Translation failed.";
}

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton() || !interaction.customId.startsWith("translate_")) return;
    const [_, messageId, langCode] = interaction.customId.split("_");

    if (!interaction.channel?.isTextBased()) {
        await interaction.reply({ content: "Channel not supported.", ephemeral: true });
        return;
    }

    let originalMessage;
    try { originalMessage = await interaction.channel.messages.fetch(messageId); } catch {
        await interaction.reply({ content: "Original message not found.", ephemeral: true });
        return;
    }

    const translatedText = await translateWithRotatingAPI(originalMessage.content, langCode);

    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle(`Translation (${langCode.toUpperCase()})`)
                .setAuthor({ name: originalMessage.author.username, iconURL: "https://cdn-icons-png.flaticon.com/512/684/684908.png" })
                .setDescription(`"${translatedText}"`)
                .setColor("Green")
        ],
        ephemeral: true
    });
});

client.login(BOT_TOKEN);