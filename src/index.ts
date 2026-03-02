import {
  Client,
  GatewayIntentBits,
  Partials,
  TextChannel,
  MessageReaction,
  User,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Interaction
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
const languages = [
  { label: "Polish", emoji: "🇵🇱", code: "pl" },
  { label: "German", emoji: "🇩🇪", code: "de" },
  { label: "Russian", emoji: "🇷🇺", code: "ru" },
  { label: "French", emoji: "🇫🇷", code: "fr" },
  { label: "Spanish", emoji: "🇪🇸", code: "es" },
  { label: "English", emoji: "🇬🇧", code: "en" }
];

// Cooldown per user (ms)
const cooldown = new Map<string, number>();

async function translateMessage(text: string, targetCode: string) {
  try {
    const res = await fetch("https://libretranslate.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: "auto", target: targetCode, format: "text" })
    });
    const data = (await res.json()) as { translatedText?: string };
    return data.translatedText ?? text;
  } catch {
    return text;
  }
}

// Reakcja 🌐 do każdej wiadomości
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  try {
    await msg.react(reactionEmoji);
  } catch {}
});

// Embed + paginacja
const translationEmbeds = new Map<
  string,
  { embed: EmbedBuilder; page: number; translations: Map<string, string> }
>();

client.on(
  "messageReactionAdd",
  async (reaction: MessageReaction | import("discord.js").PartialMessageReaction, user: User | import("discord.js").PartialUser) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.emoji.name !== reactionEmoji) return;

    const message = reaction.message;
    if (!(message.channel instanceof TextChannel)) return;

    // Jeśli embed już istnieje dla tej wiadomości → nie tworzymy nowego
    if (translationEmbeds.has(message.id)) return;

    const embed = new EmbedBuilder()
      .setTitle("Translation")
      .setDescription(message.content)
      .setColor("Blue")
      .setFooter({ text: "Click a flag to change translation language" });

    const translations = new Map<string, string>();
    translationEmbeds.set(message.id, { embed, page: 0, translations });

    const row = new ActionRowBuilder<ButtonBuilder>();
    languages.forEach((lang) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`translate-${message.id}-${lang.code}`)
          .setLabel(lang.label)
          .setEmoji(lang.emoji)
          .setStyle(ButtonStyle.Primary)
      );
    });

    await message.channel.send({ embeds: [embed], components: [row] });
  }
);

// Kliknięcie przycisku flagi
client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isButton()) return;

  const [action, messageId, langCode] = interaction.customId.split("-");
  if (action !== "translate") return;

  // Sprawdzamy cooldown 5s
  const last = cooldown.get(interaction.user.id);
  if (last && Date.now() - last < 5000) return;
  cooldown.set(interaction.user.id, Date.now());

  const info = translationEmbeds.get(messageId);
  if (!info) return;

  const { embed, translations } = info;

  // Jeśli brak tłumaczenia → pobierz
  if (!translations.has(langCode)) {
    const channel = interaction.channel;
    if (!channel || !(channel instanceof TextChannel)) return;

    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg) return;

    const translated = await translateMessage(msg.content, langCode);
    translations.set(langCode, translated);
  }

  // Aktualizujemy embed na nową stronę
  embed.setDescription(translations.get(langCode) ?? embed.data.description ?? null);
  info.page = languages.findIndex((l) => l.code === langCode);

  // Usuwamy wszystkie reakcje użytkownika, żeby nie klikał wielu naraz
  const channel = interaction.channel;
  if (channel && channel instanceof TextChannel) {
    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (msg) {
      const userReactions = msg.reactions.cache.filter((r) => r.users.cache.has(interaction.user.id));
      for (const r of userReactions.values()) {
        await r.users.remove(interaction.user.id).catch(() => {});
      }
    }
  }

  await interaction.update({ embeds: [embed] });
});

client.once("ready", () => console.log(`Logged in as ${client.user?.tag}`));
client.login(process.env.BOT_TOKEN);