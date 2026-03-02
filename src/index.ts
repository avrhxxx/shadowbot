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

const LIBRE_URL =
    process.env.LIBRE_URL || "https://libretranslate-production-26a3.up.railway.app/translate";

const LANGUAGES = [
    { code: "en", label: "English", emoji: "🇬🇧" },
    { code: "pl", label: "Polish", emoji: "🇵🇱" },
    { code: "de", label: "German", emoji: "🇩🇪" },
    { code: "fr", label: "French", emoji: "🇫🇷" },
    { code: "ru", label: "Russian", emoji: "🇷🇺" }
];

// -------------------------
// Reaction Queue
// -------------------------
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

            await message.react("🌐");
            await new Promise(res => setTimeout(res, 900));
        } catch (err) {
            console.error("Reaction queue error:", err);
        }
    }

    processingQueue = false;
}

// -------------------------
// Ready
// -------------------------
client.once("clientReady", () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

// -------------------------
// Auto Reaction
// -------------------------
client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.inGuild()) return;

    reactionQueue.push(`${message.channelId}:${message.id}`);
    processReactionQueue();
});

// -------------------------
// Reaction Click → Show Translation Panel
// -------------------------
const translationPanels = new Map<string, string>(); // messageId → panelId

client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.emoji.name !== "🌐" || !reaction.message.inGuild()) return;

    const message = reaction.message;
    if (translationPanels.has(message.id)) return; // panel już istnieje

    const embed = new EmbedBuilder()
        .setTitle("Translation Panel (Beta)") // nad autorem
        .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL()
        })
        .setDescription(`"${message.content}"`)
        .setColor("Blue")
        .setFooter({ text: `You have 30 seconds to click a button` });

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
    translationPanels.set(message.id, sent.id);

    // -------------------------
    // Dynamic Countdown Footer
    // -------------------------
    let secondsLeft = 30;
    const countdown = setInterval(async () => {
        if (secondsLeft <= 0) {
            clearInterval(countdown);
            try {
                await sent.delete().catch(() => {});
                translationPanels.delete(message.id);
            } catch {}
            return;
        }
        secondsLeft--;
        try {
            await sent.edit({
                embeds: [EmbedBuilder.from(embed).setFooter({ text: `You have ${secondsLeft}s to click a button` })]
            });
        } catch {}
    }, 1000);
});

// -------------------------
// Button Interaction → Translate
// -------------------------
client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("translate_")) return;

    const parts = interaction.customId.split("_");
    const messageId = parts[1];
    const langCode = parts[2];

    if (!interaction.channel || !interaction.channel.isTextBased()) {
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
                .setAuthor({
                    name: originalMessage.author.username,
                    iconURL: originalMessage.author.displayAvatarURL()
                })
                .setDescription(`"${translatedText}"`)
                .setColor("Green")
        ],
        ephemeral: true
    });
});

// -------------------------
// Login
// -------------------------
client.login(BOT_TOKEN);