// src/modules/TranslationModule.ts
import {
    Client,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ComponentType,
    Message,
    MessageFlags
} from "discord.js";
import fetch from "node-fetch";

const LIBRE_URL =
    process.env.LIBRE_URL ||
    "https://libretranslate-production-26a3.up.railway.app/translate";

const GOOGLE_URL =
    process.env.GOOGLE_URL ||
    "https://translate.googleapis.com/translate_a/single";

interface LibreResponse {
    translatedText: string;
}

type GoogleResponse = string[][][];

const LANGUAGES = [
    { code: "en", label: "English", emoji: "🇬🇧" },
    { code: "pl", label: "Polish", emoji: "🇵🇱" },
    { code: "de", label: "German", emoji: "🇩🇪" },
    { code: "fr", label: "French", emoji: "🇫🇷" },
    { code: "ru", label: "Russian", emoji: "🇷🇺" }
];

export function initTranslationModule(client: Client) {
    // Auto reakcja 🌍
    client.on("messageCreate", async (message: Message) => {
        if (message.author.bot || !message.inGuild()) return;
        try { await message.react("🌍"); } catch {}
    });

    client.on("messageReactionAdd", async (reaction, user) => {
        if (user.bot) return;
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();
        if (reaction.emoji.name !== "🌍") return;
        if (!reaction.message.inGuild()) return;

        const message = reaction.message;

        // Embed z tytułem nad autorem
        const embed = new EmbedBuilder()
            .setTitle("🌍 Translation Panel")
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
            .setDescription(`"${message.content}"`)
            .setColor("Blue")
            .setFooter({ text: "You have 60 seconds to choose a language." });

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

        const panel = await message.channel.send({ embeds: [embed], components: rows });

        const collector = panel.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60_000
        });

        collector.on("collect", async interaction => {
            try {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const [, , langCode] = interaction.customId.split("_");
                const translated = await translateText(message.content, langCode);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`🌍 Translation (${langCode.toUpperCase()})`)
                            .setDescription(`"${translated}"`)
                            .setColor("Green")
                    ]
                });
            } catch (err) { console.error("Interaction error:", err); }
        });

        // Po 60s wyłączamy przyciski i usuwamy embed
        collector.on("end", async () => {
            const disabledRows = rows.map(row => { row.components.forEach(c => c.setDisabled(true)); return row; });
            try {
                await panel.edit({ components: disabledRows, embeds: [embed.setFooter({ text: "Translation panel expired." })] });
                setTimeout(async () => {
                    try { await panel.delete().catch(() => {}); } catch {}
                }, 1000);
            } catch {}
        });
    });

    // Funkcja tłumaczenia z rotacją Libre ↔ Google
    async function translateText(text: string, target: string): Promise<string> {
        const servers: ("libre" | "google")[] = ["libre", "google"];
        for (const server of servers) {
            if (server === "libre") {
                try {
                    const res = await fetch(LIBRE_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ q: text, source: "auto", target, format: "text" })
                    });
                    if (res.ok) {
                        const data = (await res.json()) as Partial<LibreResponse>;
                        if (typeof data.translatedText === "string") return data.translatedText;
                    }
                } catch {}
            } else if (server === "google") {
                try {
                    const params = new URLSearchParams({ client: "gtx", sl: "auto", tl: target, dt: "t", q: text });
                    const res = await fetch(`${GOOGLE_URL}?${params.toString()}`);
                    const data = (await res.json()) as GoogleResponse;
                    if (Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0]) && typeof data[0][0][0] === "string") {
                        return data[0][0][0];
                    }
                } catch {}
            }
        }
        return "Translation failed.";
    }
}