import {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
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
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN is not defined");
const BOT_TOKEN = process.env.BOT_TOKEN;

const LIBRE_URL =
  process.env.LIBRE_URL ||
  "https://libretranslate-production-26a3.up.railway.app/translate";

const LANGUAGES = [
  { code: "en", label: "English", emoji: "🇬🇧" },
  { code: "pl", label: "Polish", emoji: "🇵🇱" },
  { code: "de", label: "German", emoji: "🇩🇪" },
  { code: "fr", label: "French", emoji: "🇫🇷" },
  { code: "ru", label: "Russian", emoji: "🇷🇺" }
];

/* =========================
   REACTION QUEUE
========================= */
const reactionQueue: string[] = [];
let processingQueue = false;

async function processReactionQueue() {
  if (processingQueue) return;
  processingQueue = true;

  while (reactionQueue.length > 0) {
    const item = reactionQueue.shift();
    if (!item) continue;

    const [channelId, messageId] = item.split(":");
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) continue;
      const message = await channel.messages.fetch(messageId);
      if (!message) continue;

      await message.react("🌐");
      await new Promise(res => setTimeout(res, 900));
    } catch (err) {
      console.error("Reaction queue error:", err);
    }
  }
  processingQueue = false;
}

/* =========================
   READY
========================= */
client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

/* =========================
   AUTO REACTION
========================= */
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.inGuild()) return;
  reactionQueue.push(`${message.channelId}:${message.id}`);
  processReactionQueue();
});

/* =========================
   REACTION CLICK
========================= */
const translationPanels = new Map<string, string>();

client.on("messageReactionAdd", async (reaction, user: User) => {
  if (user.bot) return;

  if (reaction.partial) await reaction.fetch();
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.emoji.name !== "🌐" || !reaction.message.inGuild()) return;

  const message = reaction.message;

  let panelMessage;
  if (translationPanels.has(message.id)) {
    try {
      panelMessage = await message.channel.messages.fetch(
        translationPanels.get(message.id)!
      );
    } catch {}
  }

  if (!panelMessage) {
    // Embed initial
    const embed = new EmbedBuilder()
      .setTitle("Translation Panel")
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL()
      })
      .setDescription(`"${message.content}"\n\nYou have 60s to click a button.`)
      .setColor("Blue");

    // Przyciski
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

    const sent = await message.channel.send({
      embeds: [embed],
      components: rows
    });

    translationPanels.set(message.id, sent.id);

    // Odświeżanie przycisków co 10 sekund + licznik
    let secondsLeft = 60;
    const interval = setInterval(async () => {
      secondsLeft -= 10;
      if (secondsLeft <= 0) {
        clearInterval(interval);
        translationPanels.delete(message.id);
        try {
          await sent.delete();
        } catch {}
        return;
      }

      const updatedEmbed = EmbedBuilder.from(embed).setDescription(
        `"${message.content}"\n\nYou have ${secondsLeft}s to click a button.`
      );
      try {
        await sent.edit({ embeds: [updatedEmbed], components: rows });
      } catch {}
    }, 10000);
  }
});

/* =========================
   BUTTON INTERACTION
========================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() || !interaction.customId.startsWith("translate_"))
    return;

  const parts = interaction.customId.split("_");
  const messageId = parts[1];
  const langCode = parts[2];

  if (!interaction.channel || !interaction.channel.isTextBased()) {
    await interaction.reply({
      content: "Channel not supported.",
      ephemeral: true
    });
    return;
  }

  let originalMessage;
  try {
    originalMessage = await interaction.channel.messages.fetch(messageId);
  } catch {
    await interaction.reply({
      content: "Original message not found.",
      ephemeral: true
    });
    return;
  }

  let translatedText = "Translation failed.";
  try {
    const res = await fetch(LIBRE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: originalMessage.content,
        source: "auto",
        target: langCode,
        format: "text"
      })
    });

    if (!res.ok) {
      console.error("Libre status:", res.status);
      translatedText = "Translation service error.";
    } else {
      const data = await res.json() as { translatedText?: string };
      translatedText = data.translatedText ?? translatedText;
    }
  } catch (err) {
    console.error("LibreTranslate error:", err);
    translatedText = "Translation service unreachable.";
  }

  // Odpowiedź prywatna
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`Translation (${langCode.toUpperCase()})`)
        .setAuthor({
          name: originalMessage.author.username,
          iconURL: originalMessage.author.displayAvatarURL()
        })
        .setDescription(`"${translatedText}"`)
        .setColor("Green")
    ],
    ephemeral: true
  });
});

/* =========================
   LOGIN
========================= */
client.login(BOT_TOKEN);