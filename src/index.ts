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

// Funkcja tłumaczenia przez LibreTranslate
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

// Dodawanie reakcji 🌐 do każdej nowej wiadomości
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  try {
    await msg.react(reactionEmoji);
  } catch {}
});

// Kliknięcie reakcji 🌐
client.on(
  "messageReactionAdd",
  async (
    reaction: MessageReaction | import("discord.js").PartialMessageReaction,
    user: User | import("discord.js").PartialUser
  ) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.emoji.name !== reactionEmoji) return;

    const message = reaction.message;
    if (!(message.channel instanceof TextChannel)) return;

    // Tworzymy ephemeral embed z przyciskami flag
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

    await (message.channel as TextChannel).send({
      content: `<@${user.id}> choose language to translate:`,
      components: [row],
      ephemeral: true // widoczne tylko dla klikającego
    });
  }
);

// Kliknięcie przycisku flagi
client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isButton()) return;

  const [action, messageId, langCode] = interaction.customId.split("-");
  if (action !== "translate") return;

  const channel = interaction.channel;
  if (!channel || !(channel instanceof TextChannel)) return;

  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) return;

  const translated = await translateMessage(msg.content, langCode);

  const embed = new EmbedBuilder()
    .setTitle(`Translation (${langCode})`)
    .setColor("Blue")
    .setDescription(translated);

  await interaction.reply({ embeds: [embed], ephemeral: true });
});

client.once("ready", () => console.log(`Logged in as ${client.user?.tag}`));
client.login(process.env.BOT_TOKEN);