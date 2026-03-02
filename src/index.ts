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

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN is not defined");
const BOT_TOKEN = process.env.BOT_TOKEN;
const LIBRE_URL = process.env.LIBRE_URL || "https://libretranslate-production-26a3.up.railway.app/translate";

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

            await message.react("🌐");
            await new Promise(res => setTimeout(res, 900));
        } catch (err) {
            console.error("Reaction queue error:", err);
        }
    }
    processingQueue = false;
}

client.once("clientReady", () => console.log(`Logged in as ${client.user?.tag}`));

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
    if (reaction.emoji.name !== "🌐" || !reaction.message.inGuild()) return;

    const message = reaction.message;
    if (translationEmbeds.has(message.id)) return;

    const embed = new EmbedBuilder()
        .setTitle("Translation Panel (Beta)")
        .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL()
        })
        .setDescription(`"${message.content}"`)
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
        embeds: [embed.setFooter({ text: `Embed will auto-delete in 60s.` })],
        components: rows
    });
    translationEmbeds.set(message.id, sent.id);

    // Dynamiczny licznik sekundowy + odświeżanie przycisków
    let secondsLeft = 60;
    const interval = setInterval(async () => {
        secondsLeft -= 1;
        if (secondsLeft <= 0) {
            clearInterval(interval);
            try { await sent.delete(); } catch {}
            translationEmbeds.delete(message.id);
        } else {
            const updatedEmbed = EmbedBuilder.from(embed)
                .setFooter({ text: `Embed will auto-delete in ${secondsLeft}s.` });
            try { await sent.edit({ embeds: [updatedEmbed], components: rows }); } catch {}
        }
    }, 1000); // co sekundę
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton() || !interaction.customId.startsWith("translate_")) return;

    const [_, messageId, langCode] = interaction.customId.split("_");
    if (!interaction.channel?.isTextBased()) {
        await interaction.reply({ content: "Channel not supported.", ephemeral: true });
        return;
    }

    let originalMessage;
    try { originalMessage = await interaction.channel.messages.fetch(messageId); }
    catch { return await interaction.reply({ content: "Original message not found.", ephemeral: true }); }

    let translatedText = "Translation failed.";
    try {
        const res = await fetch(LIBRE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: originalMessage.content, source: "auto", target: langCode, format: "text" })
        });
        if (!res.ok) translatedText = "Translation service error.";
        else {
            const data = await res.json() as { translatedText?: string };
            translatedText = data.translatedText ?? translatedText;
        }
    } catch (err) {
        console.error("LibreTranslate error:", err);
        translatedText = "Translation service unreachable.";
    }

    try {
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Translation (${langCode.toUpperCase()})`)
                    .setDescription(translatedText)
                    .setColor("Green")
            ],
            ephemeral: true
        });
    } catch (err) {
        console.error("Interaction reply error:", err);
    }
});

client.login(BOT_TOKEN);