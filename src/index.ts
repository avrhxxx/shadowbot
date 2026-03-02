import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, Message } from "discord.js";
import fetch from "node-fetch";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Środowiskowe
const TOKEN = process.env.BOT_TOKEN;
const LIBRE_API = process.env.LIBRE_TRANSLATE_API || "https://libretranslate.de/translate";

// Lista dostępnych języków
const LANGUAGES = [
  { code: "en", emoji: "🇬🇧", name: "English" },
  { code: "pl", emoji: "🇵🇱", name: "Polish" },
  { code: "de", emoji: "🇩🇪", name: "German" },
  { code: "fr", emoji: "🇫🇷", name: "French" },
  { code: "es", emoji: "🇪🇸", name: "Spanish" },
];

// Pomocnicza funkcja tłumaczenia
async function translateText(text: string, targetLang: string) {
  const res = await fetch(LIBRE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: "auto", target: targetLang, format: "text" }),
  });
  const data = await res.json();
  return data.translatedText as string;
}

// Obsługa kliknięcia przycisku "Translate"
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "translate_button") {
    const message = interaction.message;

    if (!("content" in message)) {
      await interaction.reply({ content: "Cannot translate this message.", ephemeral: true });
      return;
    }

    // ephemeral embed z loaderem
    const embed = new EmbedBuilder()
      .setTitle("Translation")
      .setDescription("Translating… ⏳")
      .setColor("Blue");

    await interaction.reply({ embeds: [embed], ephemeral: true });

    // Domyślnie tłumaczymy na język klikającego lub polski
    const translated = await translateText(message.content, "pl");

    const finalEmbed = new EmbedBuilder()
      .setTitle("Translation")
      .setColor("Blue")
      .addFields(
        { name: "Original", value: message.content },
        { name: "Translated (Polish)", value: translated }
      )
      .setFooter({ text: "Click a flag to change language" });

    // Przyciski z flagami
    const buttons = new ActionRowBuilder<ButtonBuilder>();
    LANGUAGES.forEach(lang => {
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(`lang_${lang.code}_${interaction.user.id}`)
          .setLabel(lang.emoji)
          .setStyle(ButtonStyle.Primary)
      );
    });

    await interaction.editReply({ embeds: [finalEmbed], components: [buttons] });
  }
});

// Obsługa kliknięcia flagi w ephemeral embed
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith("lang_")) {
    const parts = interaction.customId.split("_");
    const langCode = parts[1];
    const userId = parts[2];

    // Tylko właściciel ephemeral może zmieniać język
    if (interaction.user.id !== userId) {
      await interaction.reply({ content: "This is not your translation session.", ephemeral: true });
      return;
    }

    const message = interaction.message;
    const original = message.embeds[0].fields?.find(f => f.name === "Original")?.value;
    if (!original) {
      await interaction.reply({ content: "Original message not found.", ephemeral: true });
      return;
    }

    await interaction.deferUpdate();

    const translated = await translateText(original, langCode);

    const updatedEmbed = EmbedBuilder.from(message.embeds[0])
      .spliceFields(1, 1, { name: `Translated (${langCode.toUpperCase()})`, value: translated });

    await interaction.editReply({ embeds: [updatedEmbed] });
  }
});

// Nasłuchiwanie wiadomości – dodajemy przycisk Translate pod każdą wiadomością
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("translate_button")
      .setLabel("Translate")
      .setStyle(ButtonStyle.Primary)
  );

  await message.react("🟢"); // przykładowa reakcja, nie jest wymagana
  // nie wysyłamy embed do wszystkich, bo przycisk działa per wiadomość
  // opcjonalnie można dodać row z buttonem pod wiadomość, ale Discord API nie pozwala automatycznie dodawać button do istniejącej wiadomości innej osoby
});

// Logowanie
client.login(TOKEN);