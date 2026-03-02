import { Client, GatewayIntentBits, Partials, MessageReaction, User, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, EmbedBuilder } from "discord.js";
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
const LIBRE_URL = process.env.LIBRE_URL || "https://libretranslate.de/translate"; // endpoint LibreTranslate
const LANGUAGES = [
    { code: "en", label: "English", emoji: "🇬🇧" },
    { code: "pl", label: "Polish", emoji: "🇵🇱" },
    { code: "de", label: "German", emoji: "🇩🇪" },
    { code: "fr", label: "French", emoji: "🇫🇷" },
    { code: "ru", label: "Russian", emoji: "🇷🇺" }
];

client.on("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

// Map do śledzenia embedów do każdej wiadomości
const translationEmbeds = new Map<string, string>(); // messageId -> embedMessageId

// 1️⃣ Dodawanie reakcji do każdej wiadomości
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    try {
        await message.react("🌐"); // tutaj emoji, które użytkownik kliknie, żeby poprosić o tłumaczenie
    } catch (err) {
        console.error("Failed to add reaction:", err);
    }
});

// 2️⃣ Kliknięcie reakcji – tworzymy lub edytujemy publiczny embed z przyciskami językowymi
client.on("messageReactionAdd", async (reaction: MessageReaction, user: User) => {
    if (user.bot) return;
    if (!reaction.message.partial) await reaction.message.fetch();
    if (reaction.emoji.name !== "🌐") return;

    const messageId = reaction.message.id;
    let embedMessage = undefined;

    // sprawdzamy, czy embed już istnieje
    if (translationEmbeds.has(messageId)) {
        const embedId = translationEmbeds.get(messageId)!;
        try {
            embedMessage = await reaction.message.channel.messages.fetch(embedId);
        } catch {}
    }

    // Tworzymy embed jeśli nie istnieje
    if (!embedMessage) {
        const embed = new EmbedBuilder()
            .setTitle("Translation Panel")
            .setDescription(`Click a flag to translate the message:\n"${reaction.message.content}"`)
            .setColor("Blue");

        const row = new ActionRowBuilder<ButtonBuilder>();
        for (const lang of LANGUAGES) {
            const btn = new ButtonBuilder()
                .setCustomId(`translate_${messageId}_${lang.code}`)
                .setLabel(lang.label)
                .setEmoji(lang.emoji)
                .setStyle(ButtonStyle.Primary);
            row.addComponents(btn);
        }

        const sent = await reaction.message.channel.send({ embeds: [embed], components: [row] });
        translationEmbeds.set(messageId, sent.id);
    }
});

// 3️⃣ Kliknięcie przycisku – tłumaczenie wiadomości i ephemeral reply
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const customId = interaction.customId; // format: translate_messageId_lang
    if (!customId.startsWith("translate_")) return;

    const parts = customId.split("_");
    const messageId = parts[1];
    const langCode = parts[2];

    let originalMessage;
    try {
        originalMessage = await interaction.channel?.messages.fetch(messageId);
        if (!originalMessage) throw new Error("Original message not found");
    } catch {
        await interaction.reply({ content: "Original message not found.", ephemeral: true });
        return;
    }

    // Wywołanie LibreTranslate
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
        const data = await res.json();
        translatedText = (data.translatedText as string) || translatedText;
    } catch (err) {
        console.error("LibreTranslate error:", err);
    }

    await interaction.reply({
        content: `**Translation (${langCode.toUpperCase()}):**\n${translatedText}`,
        ephemeral: true
    });
});

client.login(BOT_TOKEN);