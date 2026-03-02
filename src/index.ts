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
const GOOGLE_URL = process.env.GOOGLE_URL || "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={lang}&dt=t&q={text}";

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
            await message.react("🌍");
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
    if (reaction.emoji.name !== "🌍") return;
    if (!reaction.message.inGuild()) return;

    const message = reaction.message;
    if (translationEmbeds.has(message.id)) return;

    const embed = new EmbedBuilder()
        .setTitle("Translation Panel (Beta)")
        .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
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

    const sent = await message.channel.send({ embeds: [embed], components: rows });
    translationEmbeds.set(message.id, sent.id);

    // Dynamiczny licznik sekund i auto-delete
    let secondsLeft = 60;
    const interval = setInterval(async () => {
        secondsLeft--;
        try {
            await sent.edit({ embeds: [embed.setFooter({ text: `You have ${secondsLeft}s to click a button` })] });
        } catch {}
        if (secondsLeft <= 0) {
            clearInterval(interval);
            try { await sent.delete(); translationEmbeds.delete(message.id); } catch {}
        }
    }, 1000);
});

async function translateText(text: string, target: string): Promise<string> {
    try {
        // Najpierw Libre
        const res = await fetch(LIBRE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: text, source: "auto", target, format: "text" })
        });
        if (res.ok) {
            const data = await res.json() as { translatedText?: string };
            if (data.translatedText) return data.translatedText;
        }
        throw new Error("Libre failed");
    } catch {
        // Fallback na nieoficjalne Google
        try {
            const url = GOOGLE_URL.replace("{lang}", target).replace("{text}", encodeURIComponent(text));
            const gRes = await fetch(url);
            const json = await gRes.json();
            if (Array.isArray(json) && json[0] && Array.isArray(json[0]) && json[0][0]) return json[0][0][0];
        } catch {}
    }
    return "Translation failed.";
}

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton() || !interaction.customId.startsWith("translate_")) return;
    const [_, messageId, langCode] = interaction.customId.split("_");
    if (!interaction.channel?.isTextBased()) return interaction.reply({ content: "Channel not supported.", ephemeral: true });

    let originalMessage;
    try { originalMessage = await interaction.channel.messages.fetch(messageId); }
    catch { return interaction.reply({ content: "Original message not found.", ephemeral: true }); }

    const translatedText = await translateText(originalMessage.content, langCode);
    await interaction.reply({
        embeds: [new EmbedBuilder().setTitle(`Translation (${langCode.toUpperCase()})`).setDescription(translatedText).setColor("Green")],
        ephemeral: true
    });
});

client.login(BOT_TOKEN);