import { Client, GatewayIntentBits, EmbedBuilder, Message, MessageReaction, User, Partials, TextChannel, PartialUser, PartialMessage, PartialMessageReaction } from "discord.js";
import dotenv from "dotenv";
import DeepL from "deepl-node";

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User]
});

// DeepL translator
const translator = new DeepL.Translator(process.env.DEEPL_API_KEY!);

type Translation = { language: string; text: string };
type TranslationData = { embedMessage: Message | null; translations: Map<string, Translation>; currentIndex: number };

const translationMessages = new Map<string, TranslationData>();

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

async function translateMessage(text: string, language: string): Promise<string> {
    try {
        const targetLang = language.slice(0, 2).toUpperCase(); // PL, DE, EN...
        const result = await translator.translateText(text, undefined, targetLang);
        return result.text;
    } catch (err) {
        console.error("Błąd tłumaczenia:", err);
        return `[${language}] ${text}`;
    }
}

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

// Listener z trzema parametrami dla TS + partial handling
client.on(
    "messageReactionAdd",
    async (
        reaction: MessageReaction | PartialMessageReaction,
        user: User | PartialUser,
        _event: any
    ) => {
        try {
            if (user.partial) await user.fetch();
            if ((user as User).bot) return;

            if (reaction.partial) await reaction.fetch();
            const msg = reaction.message;
            if (msg.partial) await msg.fetch();

            if (!msg || !msg.id || !msg.channel) return;

            const data = translationMessages.get(msg.id);
            if (!data) return;

            // Przewijanie embedów
            if (reaction.emoji?.name === "⬅️") {
                if (data.translations.size === 0) return;
                data.currentIndex = (data.currentIndex - 1 + data.translations.size) % data.translations.size;
            } else if (reaction.emoji?.name === "➡️") {
                if (data.translations.size === 0) return;
                data.currentIndex = (data.currentIndex + 1) % data.translations.size;
            } else {
                const language = reaction.emoji?.name ? getLanguageFromEmoji(reaction.emoji.name) : null;
                if (!language) return;

                if (data.translations.size >= 10 && !data.translations.has((user as User).id)) return;

                const translatedText = await translateMessage(msg.content, language);
                data.translations.set((user as User).id, { language, text: translatedText });
                data.currentIndex = data.translations.size - 1;
            }

            const embed = buildEmbed(msg as Message, Array.from(data.translations.values()), data.currentIndex);

            if (!msg.channel.isTextBased()) return;
            const textChannel = msg.channel as TextChannel;

            if (data.embedMessage) {
                await data.embedMessage.edit({ embeds: [embed] });
            } else {
                const embedMsg = await textChannel.send({ embeds: [embed] });
                data.embedMessage = embedMsg;
                await embedMsg.react("⬅️");
                await embedMsg.react("➡️");
            }
        } catch (err) {
            console.error("Reaction handling error:", err);
        }
    }
);

client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

client.login(process.env.DISCORD_TOKEN);