import {
    Client,
    GatewayIntentBits,
    Partials,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    InteractionFlags
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

if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is not defined");
}
const BOT_TOKEN = process.env.BOT_TOKEN;

/* =========================
   🔥 STABILNIEJSZY ENDPOINT
========================= */
const LIBRE_URL =
    process.env.LIBRE_URL ||
    "http://libretranslate-production-26a3.up.railway.app/translate";

/* =========================
   JĘZYKI
========================= */
const LANGUAGES = [
    { code: "en", label: "English", emoji: "🇬🇧" },
    { code: "pl", label: "Polish", emoji: "🇵🇱" },
    { code: "de", label: "German", emoji: "🇩🇪" },
    { code: "fr", label: "French", emoji: "🇫🇷" },
    { code: "ru", label: "Russian", emoji: "🇷🇺" }
];

/* =========================
   REACTION QUEUE
========================= */
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
            await new Promise(res => setTimeout(res, 1200)); // mini delay

        } catch (err) {
            console.error("Reaction queue error:", err);
        }
    }

    processingQueue = false;
}

/* =========================
   READY
========================= */
client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

/* =========================
   AUTO REACTION
========================= */
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.inGuild()) return;

    reactionQueue.push(`${message.channelId}:${message.id}`);
    processReactionQueue();
});

/* =========================
   REACTION CLICK
========================= */
const translationEmbeds = new Map<string, string>();

client.on(
    "messageReactionAdd",
    async (
        reaction: MessageReaction | PartialMessageReaction,
        user: any, // User | PartialUser
        _details: any
    ) => {
        if (user?.bot) return;

        try {
            if (reaction.partial) await reaction.fetch();
            if (reaction.message.partial) await reaction.message.fetch();
        } catch {}

        if (reaction.emoji?.name !== "🌐") return;
        if (!reaction.message.inGuild()) return;

        const message = reaction.message;
        let existingPanel;

        if (translationEmbeds.has(message.id)) {
            try {
                existingPanel = await message.channel.messages.fetch(
                    translationEmbeds.get(message.id)!
                );
            } catch {}
        }

        if (!existingPanel) {
            const embed = new EmbedBuilder()
                .setTitle("Translation Panel")
                .setDescription(
                    `Click a flag to translate:\n\n"${message.content}"`
                )
                .setColor("Blue");

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

            const sent = await message.channel.send({
                embeds: [embed],
                components: rows
            });

            translationEmbeds.set(message.id, sent.id);
        }
    }
);

/* =========================
   BUTTON INTERACTION
========================= */
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("translate_")) return;

    const parts = interaction.customId.split("_");
    const messageId = parts[1];
    const langCode = parts[2];

    if (!interaction.channel || !interaction.channel.isTextBased()) {
        await interaction.reply({
            content: "Channel not supported.",
            flags: InteractionFlags.Ephemeral
        });
        return;
    }

    let originalMessage;
    try {
        originalMessage = await interaction.channel.messages.fetch(messageId);
    } catch {
        await interaction.reply({
            content: "Original message not found.",
            flags: InteractionFlags.Ephemeral
        });
        return;
    }

    const textToTranslate = originalMessage.content ?? "";
    let translatedText = "Translation failed.";

    try {
        const res = await fetch(LIBRE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                q: textToTranslate,
                source: "auto",
                target: langCode,
                format: "text"
            })
        });

        if (!res.ok) {
            console.error("Libre status:", res.status, await res.text());
            translatedText = "Translation service error.";
        } else {
            const data = (await res.json()) as { translatedText?: string };
            translatedText = data.translatedText ?? translatedText;
        }
    } catch (err) {
        console.error("LibreTranslate error:", err);
        translatedText = "Translation service unreachable.";
    }

    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle(`Translation (${langCode.toUpperCase()})`)
                .setDescription(translatedText)
                .setColor("Green")
        ],
        flags: InteractionFlags.Ephemeral
    });
});

/* =========================
   LOGIN
========================= */
client.login(BOT_TOKEN);