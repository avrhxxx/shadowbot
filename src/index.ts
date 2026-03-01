import { Client, GatewayIntentBits, EmbedBuilder, Message, TextChannel, MessageReaction, User, Partials } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Typy dla tłumaczeń
type Translation = {
    language: string;
    text: string;
};

type TranslationData = {
    embedMessage: Message | null;
    translations: Map<string, Translation>; // userId -> Translation
    currentIndex: number; // do przewijania embedów
};

const translationMessages = new Map<string, TranslationData>(); // messageId -> TranslationData

// Helper: mapowanie emoji -> język
function getLanguageFromEmoji(emoji: string): string | null {
    const map: Record<string, string> = {
        "🇵🇱": "Polish",
        "🇩🇪": "German",
        "🇷🇺": "Russian",
        "🇫🇷": "French",
        "🇪🇸": "Spanish",
        "🇬🇧": "English"
        // dodaj kolejne flagi według potrzeb
    };
    return map[emoji] || null;
}

// Mock tłumaczenia – w praktyce podłącz API typu Google Translate / DeepL
async function translateMessage(text: string, language: string): Promise<string> {
    return `[${language}] ${text}`; // tymczasowe mockowanie
}

// Tworzenie lub aktualizacja embedu
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

// Nasłuchiwanie wiadomości
client.on("messageCreate", (message) => {
    if (message.author.bot) return;

    translationMessages.set(message.id, { embedMessage: null, translations: new Map(), currentIndex: 0 });
});

// Reakcje: dodawanie tłumaczenia lub przewijanie embedów
client.on("messageReactionAdd", async (reaction: MessageReaction, user: User) => {
    if (user.bot || !reaction.message.id) return;

    const data = translationMessages.get(reaction.message.id);
    if (!data) return;

    // Przewijanie embedów strzałkami
    if (reaction.emoji.name === "⬅️") {
        if (data.translations.size === 0) return;
        data.currentIndex = (data.currentIndex - 1 + data.translations.size) % data.translations.size;
    } else if (reaction.emoji.name === "➡️") {
        if (data.translations.size === 0) return;
        data.currentIndex = (data.currentIndex + 1) % data.translations.size;
    } else {
        // Tłumaczenie według flagi
        const language = getLanguageFromEmoji(reaction.emoji.name!);
        if (!language) return;

        // Limit 10 języków
        if (data.translations.size >= 10 && !data.translations.has(user.id)) return;

        const translatedText = await translateMessage(reaction.message.content, language);
        data.translations.set(user.id, { language, text: translatedText });
        data.currentIndex = data.translations.size - 1; // ustaw na ostatnie tłumaczenie
    }

    const embed = buildEmbed(reaction.message, Array.from(data.translations.values()), data.currentIndex);

    if (data.embedMessage) {
        await data.embedMessage.edit({ embeds: [embed] });
    } else {
        const embedMsg = await reaction.message.channel.send({ embeds: [embed] });
        data.embedMessage = embedMsg;

        // dodaj reakcje do przewijania
        await embedMsg.react("⬅️");
        await embedMsg.react("➡️");
    }
});

client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

client.login(process.env.DISCORD_TOKEN);