import {
    Client,
    GatewayIntentBits,
    Partials,
    TextChannel,
    Message,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from "discord.js";
import fetch from "node-fetch";

// Klient Discord
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel, Partials.User, Partials.Reaction],
});

// Typy dla tłumaczeń
type Translation = { language: string; text: string };
type TranslationData = { embedMessage: Message | null; translations: Translation[]; currentIndex: number };

// Mapy
const translationMessages = new Map<string, TranslationData>();
const disabledUsers = new Map<string, Set<string>>(); // messageId => set of userIds

// Mapowanie emoji lub skrótów na języki
const languageMap: Record<string, string> = {
    pl: "Polish",
    de: "German",
    ru: "Russian",
    fr: "French",
    es: "Spanish",
    en: "English",
};

// Tłumaczenie przez LibreTranslate
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

// Funkcja budująca embed
function buildEmbed(original: Message, translations: Translation[], currentIndex: number): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setTitle("Translations")
        .setColor("Blue")
        .setDescription(`Original message by ${original.author}:\n"${original.content}"`);

    if (translations.length > 0) {
        const t = translations[currentIndex];
        embed.addFields({ name: t.language, value: t.text });
        embed.setFooter({ text: `Translation ${currentIndex + 1}/${translations.length} – Use ⬅️ / ➡️ to switch languages` });
    }

    return embed;
}

// Przyciski przewijania
function createNavigationButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Primary)
    );
}

// Przyciski Translate i Disable
function createTranslateRow(messageId: string, userId?: string): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>();

    if (!userId || !(disabledUsers.get(messageId)?.has(userId))) {
        row.addComponents(
            new ButtonBuilder().setCustomId(`translate-${messageId}`).setLabel("Translate 🌐").setStyle(ButtonStyle.Primary)
        );
    }

    row.addComponents(
        new ButtonBuilder().setCustomId(`disable-${messageId}`).setLabel("❌ Disable Translate").setStyle(ButtonStyle.Danger)
    );

    return row;
}

// Dropdown wyboru języka
function createLanguageSelect(): ActionRowBuilder<StringSelectMenuBuilder> {
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("select-language")
            .setPlaceholder("Choose a language")
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel("Polish").setValue("Polish"),
                new StringSelectMenuOptionBuilder().setLabel("German").setValue("German"),
                new StringSelectMenuOptionBuilder().setLabel("Russian").setValue("Russian"),
                new StringSelectMenuOptionBuilder().setLabel("French").setValue("French"),
                new StringSelectMenuOptionBuilder().setLabel("Spanish").setValue("Spanish"),
                new StringSelectMenuOptionBuilder().setLabel("English").setValue("English")
            )
    );
}

// Nasłuchiwanie nowych wiadomości
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    translationMessages.set(message.id, { embedMessage: null, translations: [], currentIndex: 0 });

    const channel = message.channel as TextChannel;
    await channel.send({
        content: "_Want translation? Click the button below!_",
        components: [createTranslateRow(message.id)]
    });
});

// Obsługa kliknięć przycisków i dropdown
client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
        const msgId = interaction.customId;

        // Przewijanie
        if (msgId === "prev" || msgId === "next") {
            const msg = interaction.message as Message;
            const data = translationMessages.get(msg.id);
            if (!data || data.translations.length === 0) return;

            if (msgId === "prev") data.currentIndex = (data.currentIndex - 1 + data.translations.length) % data.translations.length;
            else data.currentIndex = (data.currentIndex + 1) % data.translations.length;

            const embed = buildEmbed(msg, data.translations, data.currentIndex);
            await interaction.update({ embeds: [embed], components: [createNavigationButtons()] });
            return;
        }

        // Wyłącz Translate
        if (msgId.startsWith("disable-")) {
            const messageId = msgId.replace("disable-", "");
            if (!disabledUsers.has(messageId)) disabledUsers.set(messageId, new Set());
            disabledUsers.get(messageId)?.add(interaction.user.id);
            await interaction.update({ content: "You have disabled translate for this message.", components: [] });
            return;
        }

        // Translate
        if (msgId.startsWith("translate-")) {
            const messageId = msgId.replace("translate-", "");
            await interaction.update({ content: "Select a language:", components: [createLanguageSelect()] });
            return;
        }
    }

    // Obsługa wyboru języka
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId !== "select-language") return;

        const language = interaction.values[0];
        const messageId = interaction.message.reference?.messageId;
        if (!messageId) return;

        const channel = interaction.channel as TextChannel;
        const msg = await channel.messages.fetch(messageId);
        if (!msg) return;

        const data = translationMessages.get(msg.id);
        if (!data) return;

        const translatedText = await translateMessage(msg.content, language);
        data.translations.push({ language, text: translatedText });
        data.currentIndex = data.translations.length - 1;

        const embed = buildEmbed(msg, data.translations, data.currentIndex);
        const embedMsg = await channel.send({ embeds: [embed], components: [createNavigationButtons()] });
        data.embedMessage = embedMsg;

        await interaction.update({ content: "Translation added!", components: [] });
    }
});

client.once("ready", () => console.log(`Logged in as ${client.user?.tag}`));
client.login(process.env.BOT_TOKEN);