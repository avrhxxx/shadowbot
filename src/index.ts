import {
    Client,
    GatewayIntentBits,
    Partials,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    TextChannel,
    User,
} from "discord.js";
import fetch from "node-fetch";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN is not defined");
const BOT_TOKEN = process.env.BOT_TOKEN;

const LIBRE_URL = process.env.LIBRE_URL || "https://libretranslate-production-26a3.up.railway.app/translate";

const LANGUAGES = [
    { code: "en", label: "English", emoji: "🇬🇧" },
    { code: "pl", label: "Polish", emoji: "🇵🇱" },
    { code: "de", label: "German", emoji: "🇩🇪" },
    { code: "fr", label: "French", emoji: "🇫🇷" },
    { code: "ru", label: "Russian", emoji: "🇷🇺" },
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

client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.inGuild()) return;

    reactionQueue.push(`${message.channelId}:${message.id}`);
    processReactionQueue();
});

const translationEmbeds = new Map<string, string>();

client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.emoji.name !== "🌐") return;
    if (!reaction.message.inGuild()) return;

    const message = reaction.message;

    let existingPanel;
    if (translationEmbeds.has(message.id)) {
        try {
            existingPanel = await message.channel.messages.fetch(translationEmbeds.get(message.id)!);
        } catch {}
    }

    if (!existingPanel) {
        const embed = new EmbedBuilder()
            .setTitle("Translation Panel")
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
            .setDescription(`"${message.content}"`)
            .setColor("Blue")
            .setFooter({ text: "You have 60s to click a button. Embed will disappear afterwards." });

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

        // Automatyczne usuwanie embeda po 60s
        let remaining = 60;
        const interval = setInterval(async () => {
            remaining -= 1;
            if (!sent.editable) return clearInterval(interval);
            try {
                const updatedEmbed = EmbedBuilder.from(embed).setFooter({ text: `You have ${remaining}s to click a button.` });
                await sent.edit({ embeds: [updatedEmbed] });
            } catch {}
        }, 1000);

        setTimeout(async () => {
            clearInterval(interval);
            try { await sent.delete(); translationEmbeds.delete(message.id); } catch {}
        }, 60000);

        // **Odświeżanie przycisków co 10 sekund – tak, żeby mogły być klikane wielokrotnie**
        const buttonRefresh = setInterval(async () => {
            try {
                await sent.edit({ components: rows });
            } catch { clearInterval(buttonRefresh); }
        }, 10000);
    }
});

async function translateText(text: string, target: string) {
    // Primary: LibreTranslate
    try {
        const res = await fetch(LIBRE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: text, source: "auto", target, format: "text" })
        });
        if (!res.ok) throw new Error(`Libre status: ${res.status}`);
        const data = await res.json() as { translatedText?: string };
        if (data.translatedText) return data.translatedText;
    } catch (err) {
        console.error("LibreTranslate error:", err);
    }

    // Fallback: Google Translate (unofficial)
    try {
        const googleRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`);
        const googleData = await googleRes.json() as any[];
        return googleData[0].map((part: any) => part[0]).join("");
    } catch (err) {
        console.error("Google Translate error:", err);
    }

    return "Translation failed.";
}

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("translate_")) return;

    const [_, messageId, langCode] = interaction.customId.split("_");
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

    let translatedText = await translateText(originalMessage.content, langCode as string);

    try {
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Translation (${langCode.toUpperCase()})`)
                    .setAuthor({ name: originalMessage.author.username, iconURL: originalMessage.author.displayAvatarURL() })
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