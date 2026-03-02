import {
    Client,
    GatewayIntentBits,
    Partials,
    Message,
    TextChannel,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    EmbedBuilder,
    MessageReaction,
    User
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

const translationMessages = new Map<string, { translations: Record<string, string> }>();
const disabledUsers = new Map<string, Set<string>>(); // messageId => set of userIds

const reactionEmoji = "🌐"; // automatycznie dodawana reakcja

const languageMap = ["Polish", "German", "Russian", "French", "Spanish", "English"];

async function translateMessage(text: string, language: string): Promise<string> {
    try {
        const targetMap: Record<string, string> = {
            Polish: "pl",
            German: "de",
            Russian: "ru",
            French: "fr",
            Spanish: "es",
            English: "en"
        };
        const target = targetMap[language] || "en";

        const response = await fetch("https://libretranslate.com/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: text, source: "auto", target, format: "text" })
        });
        const data = (await response.json()) as { translatedText?: string };
        return data.translatedText ?? `[${language}] ${text}`;
    } catch (err) {
        console.error("LibreTranslate error:", err);
        return `[${language}] ${text}`;
    }
}

// Dodawanie reakcji do każdej nowej wiadomości
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    try {
        await message.react(reactionEmoji);
    } catch (err) {
        console.error("Reaction failed:", err);
    }
});

// Obsługa kliknięcia reakcji
client.on("messageReactionAdd", async (reaction: MessageReaction, user: User) => {
    if (user.bot) return;
    if (reaction.emoji.name !== reactionEmoji) return;

    const message = reaction.message;
    if (!message.guild) return;

    // Sprawdzamy Disable
    if (disabledUsers.get(message.id)?.has(user.id)) return;

    // Pokazujemy dropdown języka tylko dla klikającego
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`select-lang-${message.id}-${user.id}`)
            .setPlaceholder("Choose a language")
            .addOptions(
                ...languageMap.map((lang) => ({
                    label: lang,
                    value: lang
                }))
            )
    );

    await message.channel.send({
        content: `<@${user.id}> select a language for translation:`,
        components: [row]
    });
});

// Obsługa dropdown wyboru języka
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    const [prefix, messageId, userId] = interaction.customId.split("-");
    if (prefix !== "select" && userId !== interaction.user.id) return;

    const language = interaction.values[0];
    const channel = interaction.channel as TextChannel;
    const msg = await channel.messages.fetch(messageId);
    if (!msg) return;

    const translatedText = await translateMessage(msg.content, language);

    const embed = new EmbedBuilder()
        .setTitle(`Translation (${language})`)
        .setColor("Blue")
        .setDescription(translatedText);

    await interaction.reply({ embeds: [embed], ephemeral: true }); // widoczne tylko dla użytkownika
});

// Logowanie bota
client.once("ready", () => console.log(`Logged in as ${client.user?.tag}`));
client.login(process.env.BOT_TOKEN);