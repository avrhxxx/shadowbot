import { Client, GatewayIntentBits, EmbedBuilder, Message, MessageReaction, User, Partials, TextChannel } from "discord.js";
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

// Emoji -> język
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

// Mock tłumaczenia (zastąp prawdziwym API później)
async function translateMessage(text: string, language: string): Promise<string> {
    return `[${language}] ${text}`;
}

// Tworzenie/aktualizacja embedu
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

// Nasłuchiwanie nowych wiadomości
client.on("messageCreate", (message) => {
    if (message.author.bot) return;

    translationMessages.set(message.id, { embedMessage: null, translations: new Map(), currentIndex: 0 });
});

// Reakcje: przewijanie lub dodanie tłumaczenia
client.on("messageReactionAdd", async (reaction: MessageReaction | Partial<MessageReaction>, user: User | Partial<User>) => {
    if (user.partial) await user.fetch();
    if (user.bot) return;

    if (reaction.partial) await reaction.fetch();
    const msg = reaction.message;
    if (msg.partial) await msg.fetch();

    const data = translationMessages.get(msg.id);
    if (!data) return;

    // Przewijanie embedów
    if (reaction.emoji.name === "⬅️") {
        if (data.translations.size === 0) return;
        data.currentIndex = (data.currentIndex - 1 + data.translations.size) % data.translations.size;
    } else if (reaction.emoji.name === "➡️") {
        if (data.translations.size === 0) return;
        data.currentIndex = (data.currentIndex + 1) % data.translations.size;
    } else {
        // Dodanie tłumaczenia według flagi
        const language = reaction.emoji.name ? getLanguageFromEmoji(reaction.emoji.name) : null;
        if (!language) return;

        if (data.translations.size >= 10 && !data.translations.has(user.id)) return;

        const translatedText = await translateMessage(msg.content, language);
        data.translations.set(user.id, { language, text: translatedText });
        data.currentIndex = data.translations.size - 1;
    }

    const embed = buildEmbed(msg, Array.from(data.translations.values()), data.currentIndex);

    const channel = msg.channel;
    if (!channel.isTextBased()) return;

    if (data.embedMessage) {
        await data.embedMessage.edit({ embeds: [embed] });
    } else {
        const embedMsg = await (channel as TextChannel).send({ embeds: [embed] });
        data.embedMessage = embedMsg;

        // Reakcje do przewijania
        await embedMsg.react("⬅️");
        await embedMsg.react("➡️");
    }
});

client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

client.login(process.env.DISCORD_TOKEN);