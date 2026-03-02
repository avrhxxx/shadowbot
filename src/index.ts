import {
    Client,
    GatewayIntentBits,
    Partials,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from "discord.js";
import fetch from "node-fetch";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ]
});

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN is not defined");
const BOT_TOKEN = process.env.BOT_TOKEN;

const LIBRE_URL = process.env.LIBRE_URL;

if (!LIBRE_URL) throw new Error("LIBRE_URL is not defined! Set only the URL without quotes or const.");

const LANGUAGES = [
    { code: "en", label: "English", emoji: "🇬🇧" },
    { code: "pl", label: "Polish", emoji: "🇵🇱" },
    { code: "de", label: "German", emoji: "🇩🇪" },
    { code: "fr", label: "French", emoji: "🇫🇷" },
    { code: "ru", label: "Russian", emoji: "🇷🇺" },
];

// Kolejka reakcji z cooldown
const reactionQueue: string[] = [];
let processingQueue = false;
const reactionCooldown = new Set<string>(); // userId:messageId dla cooldown

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

            await message.react("🌐");
            await new Promise(res => setTimeout(res, 900));

        } catch (err) {
            console.error("Reaction queue error:", err);
        }
    }

    processingQueue = false;
}

// Ready
client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

// Auto reaction
client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.inGuild()) return;
    reactionQueue.push(`${message.channelId}:${message.id}`);
    processReactionQueue();
});

const translationEmbeds = new Map<string, string>();

// Reaction click
client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.emoji.name !== "🌐") return;
    if (!reaction.message.inGuild()) return;

    const key = `${user.id}:${reaction.message.id}`;
    if (reactionCooldown.has(key)) return; // cooldown
    reactionCooldown.add(key);
    setTimeout(() => reactionCooldown.delete(key), 5000); // 5s cooldown

    const message = reaction.message;

    // Sprawdź czy embed już istnieje
    let existingPanel;
    if (translationEmbeds.has(message.id)) {
        try {
            existingPanel = await message.channel.messages.fetch(translationEmbeds.get(message.id)!);
        } catch {}
    }

    if (!existingPanel) {
        const embed = new EmbedBuilder()
            .setTitle("Translation Panel")
            .setDescription(`Click a flag to translate:\n\n"${message.content}"`)
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

        const sent = await message.channel.send({ embeds: [embed], components: rows });
        translationEmbeds.set(message.id, sent.id);

        // Auto-delete panel po 30 sekundach
        setTimeout(async () => {
            try {
                await sent.delete();
                translationEmbeds.delete(message.id);
            } catch {}
        }, 30_000);
    }
});

// Button interaction
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("translate_")) return;

    const parts = interaction.customId.split("_");
    const messageId = parts[1];
    const langCode = parts[2];

    if (!interaction.channel?.isTextBased()) {
        await interaction.reply({ content: "Channel not supported.", ephemeral: true });
        return;
    }

    let originalMessage;
    try {
        originalMessage = await interaction.channel.messages.fetch(messageId);
    } catch {
        await interaction.reply({ content: "Original message not found.", ephemeral: true });
        return;
    }

    let translatedText = "Translation failed.";

    try {
        const res = await fetch(LIBRE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                q: originalMessage.content,
                source: "auto",
                target: langCode,
                format: "text"
            })
        });

        if (!res.ok) {
            console.error("Libre status:", res.status);
            translatedText = "Translation service error.";
        } else {
            const data = await res.json() as { translatedText?: string };
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
        ephemeral: true
    });
});

client.login(BOT_TOKEN);