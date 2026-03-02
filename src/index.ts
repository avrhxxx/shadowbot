import {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    Message,
    MessageReaction,
    User,
    Partials,
    TextChannel,
    PartialUser,
    PartialMessage,
    PartialMessageReaction
} from "discord.js";
import fetch from "node-fetch";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User]
});

type Translation = { language: string; text: string };
type TranslationData = { embedMessage: Message | null; translations: Map<string, Translation>; currentIndex: number };

// Przechowuje oryginalne wiadomości i tłumaczenia
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

// Funkcja tłumaczenia przy użyciu LibreTranslate
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

        // TS poprawka: jawne typowanie odpowiedzi
        const data: { translatedText?: string } = await response.json();
        return data.translatedText ?? `[${language}] ${text}`;
    } catch (err) {
        console.error("LibreTranslate error:", err);
        return `[${language}] ${text}`;
    }
}

// Budowanie embeda z aktualnym tłumaczeniem
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

// Listener reakcji z obsługą partiali
client.on(
    "messageReactionAdd",
    async (
        reaction: MessageReaction | PartialMessageReaction,
        user: User | PartialUser
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

            // Obsługa przewijania ⬅️ / ➡️
            if (reaction.emoji?.name === "⬅️") {
                if (data.translations.size === 0) return;
                data.currentIndex = (data.currentIndex - 1 + data.translations.size) % data.translations.size;
            } else if (reaction.emoji?.name === "➡️") {
                if (data.translations.size === 0) return;
                data.currentIndex = (data.currentIndex + 1) % data.translations.size;
            } else {
                // TS poprawka: jawne sprawdzenie emoji
                const emojiName = reaction.emoji?.name;
                if (!emojiName) return;

                const language = getLanguageFromEmoji(emojiName);
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

// Logowanie bota
client.login(process.env.BOT_TOKEN);