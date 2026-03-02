import {
    Client,
    GatewayIntentBits,
    Partials,
    TextChannel,
    MessageReaction,
    User,
    ActionRowBuilder,
    StringSelectMenuBuilder,
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
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User]
});

const reactionEmoji = "🌐";
const languageMap = ["Polish", "German", "Russian", "French", "Spanish", "English"];
const disabledUsers = new Map<string, Set<string>>(); // messageId -> userId set

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
        const target = targetMap[language] ?? "en";

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

// Dodawanie automatycznej reakcji 🌐
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    try {
        await message.react(reactionEmoji);
    } catch (err) {
        console.error("Reaction failed:", err);
    }
});

// Obsługa kliknięcia reakcji (partial safe)
client.on(
    "messageReactionAdd",
    async (
        reaction: MessageReaction | import("discord.js").PartialMessageReaction,
        user: User | import("discord.js").PartialUser,
        _details?: import("discord.js").MessageReactionEventDetails
    ) => {
        if (user.bot) return;

        if (reaction.partial) {
            try { await reaction.fetch(); } 
            catch (err) { console.error("Fetch reaction failed:", err); return; }
        }

        const message = reaction.message;
        if (!message.guild) return;

        if (reaction.emoji.name !== reactionEmoji) return;
        if (!(message.channel instanceof TextChannel)) return;

        // Disable check
        if (disabledUsers.get(message.id)?.has(user.id)) return;

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`select-lang-${message.id}-${user.id}`)
                .setPlaceholder("Choose a language")
                .addOptions(languageMap.map((lang) => ({ label: lang, value: lang })))
        );

        await message.channel.send({
            content: `<@${user.id}> select a language for translation:`,
            components: [row],
        });
    }
);

// Obsługa dropdown wyboru języka
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    const [prefix, messageId, userId] = interaction.customId.split("-");
    if (prefix !== "select" || userId !== interaction.user.id) return;

    const language = interaction.values[0];
    const channel = interaction.channel;
    if (!channel || !(channel instanceof TextChannel)) return;

    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg) return;

    const translatedText = await translateMessage(msg.content, language);

    const embed = new EmbedBuilder()
        .setTitle(`Translation (${language})`)
        .setColor("Blue")
        .setDescription(translatedText);

    await interaction.reply({ embeds: [embed], ephemeral: true });
});

client.once("ready", () => console.log(`Logged in as ${client.user?.tag}`));
client.login(process.env.BOT_TOKEN);