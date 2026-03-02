import {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    Message,
    User,
    Partials,
    TextChannel,
    PartialUser,
    PartialMessage,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType
} from "discord.js";
import fetch from "node-fetch";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.User]
});

// Typy dla tłumaczeń
type Translation = { language: string; text: string };
type TranslationData = { embedMessage: Message | null; translations: Map<string, Translation>; currentIndex: number };

const translationMessages = new Map<string, TranslationData>();

// Mapowanie emoji na języki
function getLanguageFromEmoji(emoji: string): string | null {
    const map: Record<string, string> = {
        "🇵🇱": "Polish",
        "🇩🇪": "German",
        "🇷🇺": "Russian",
        "🇫🇷": "French",
        "🇪🇸": "Spanish",
        "🇬🇧": "English"
    };
    return map[emoji] || null;
}

// Tłumaczenie przez LibreTranslate
async function translateMessage(text: string, language: string): Promise<string> {
    try {
        const targetMap: Record<string, string> = {
            "Polish": "pl",
            "German": "de",
            "Russian": "ru",
            "French": "fr",
            "Spanish": "es",
            "English": "en"
        };
        const targetLang = targetMap[language] || "en";

        const response = await fetch("https://libretranslate.com/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: text, source: "auto", target: targetLang, format: "text" })
        });

        const data = (await response.json()) as { translatedText?: string };
        return data.translatedText ?? `[${language}] ${text}`;
    } catch (err) {
        console.error("LibreTranslate error:", err);
        return `[${language}] ${text}`;
    }
}

// Tworzenie embeda
function buildEmbed(original: Message, translations: Translation[], currentIndex: number): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setTitle("Translations")
        .setColor("Blue")
        .setDescription(`Original message by ${original.author}:\n"${original.content}"`);

    if (translations.length > 0) {
        const t = translations[currentIndex];
        embed.addFields({ name: `${t.language}`, value: t.text });
        embed.setFooter({ text: `Translation ${currentIndex + 1}/${translations.length}` });
    }

    return embed;
}

// Tworzenie przycisków do przewijania
function createNavigationButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Primary)
    );
}

// Nasłuchiwanie nowych wiadomości
client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    translationMessages.set(message.id, { embedMessage: null, translations: new Map(), currentIndex: 0 });
});

// Nasłuchiwanie reakcji emoji w celu tłumaczenia (bez przewijania)
client.on("messageReactionAdd", async (reaction, user) => {
    try {
        if (user.partial) await user.fetch();
        if ((user as User).bot) return;

        if (reaction.partial) await reaction.fetch();
        const msg = reaction.message;
        if (msg.partial) await msg.fetch();
        if (!msg || !msg.id || !msg.channel || !msg.content) return;

        const data = translationMessages.get(msg.id);
        if (!data) return;

        const emojiName = reaction.emoji?.name;
        if (!emojiName) return;

        const language = getLanguageFromEmoji(emojiName);
        if (!language) return;

        if (data.translations.size >= 10 && !data.translations.has((user as User).id)) return;

        const translatedText = await translateMessage(msg.content, language);
        data.translations.set((user as User).id, { language, text: translatedText });
        data.currentIndex = data.translations.size - 1;

        const embed = buildEmbed(msg as Message, Array.from(data.translations.values()), data.currentIndex);
        const textChannel = msg.channel as TextChannel;

        if (data.embedMessage) {
            await data.embedMessage.edit({ embeds: [embed] });
        } else {
            const embedMsg = await textChannel.send({ embeds: [embed], components: [createNavigationButtons()] });
            data.embedMessage = embedMsg;
        }
    } catch (err) {
        console.error("Reaction handling error:", err);
    }
});

// Obsługa przycisków
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const msg = interaction.message;
    const data = translationMessages.get(msg.id);
    if (!data) return;
    if (data.translations.size === 0) return;

    if (interaction.customId === "prev") {
        data.currentIndex = (data.currentIndex - 1 + data.translations.size) % data.translations.size;
    } else if (interaction.customId === "next") {
        data.currentIndex = (data.currentIndex + 1) % data.translations.size;
    }

    const embed = buildEmbed(msg as Message, Array.from(data.translations.values()), data.currentIndex);

    await interaction.update({ embeds: [embed] });
});

client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

client.login(process.env.BOT_TOKEN);