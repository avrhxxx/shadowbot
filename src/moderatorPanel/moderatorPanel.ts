// src/moderatorPanel/moderatorPanel.ts
import {
  Client,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  EmbedBuilder,
  Message
} from "discord.js";

import { renderEventPanel } from "../eventsPanel/eventPanel"; // EventPanel renderer
import { handleModeratorHelp } from "./moderatorButtons/moderatorHelp";
import { handleEventMenu } from "./moderatorButtons/eventMenu";
import { handlePointsMenu } from "./moderatorButtons/pointsMenu"; // placeholder
import { handleTranslateMenu } from "./moderatorButtons/translateMenu"; // placeholder
import { handleAbsenceMenu } from "./moderatorButtons/absenceMenu"; // placeholder

// ---- wersja panelu (można inkrementować przy zmianach) ----
const PANEL_VERSION = "1.0.0";

// --- helper do embedu z formatami dat i stopką ---
function renderDateFormatsEmbed(): EmbedBuilder {
  const unixTimestamp = Math.floor(Date.now() / 1000);
  return new EmbedBuilder()
    .setTitle("📅 Accepted Date & Time Formats")
    .setDescription("Please enter dates and times in one of the following formats:")
    .addFields(
      {
        name: "🕰 Date + Time",
        value:
          `DD.MM HH:MM   → 18.07 20:30\n` +
          `DD/MM HH:MM   → 18/07 20:30\n` +
          `DD-MM HH:MM   → 18-07 20:30\n` +
          `DD.MM HHMM    → 18.07 2030\n` +
          `DD/MM HHMM    → 18/07 2030\n` +
          `DD-MM HHMM    → 18-07 2030\n` +
          `DDMM HHMM     → 1807 2030\n` +
          `DDMMHHMM      → 18072030`
      },
      { name: "📆 Year only", value: "YYYY → 2026" },
      { name: "Tip", value: "No need for magic wands — just type it straight! ✨" }
    )
    .setColor("Blue")
    .setFooter({
      text: `Last updated: <t:${unixTimestamp}:F> | Version: ${PANEL_VERSION}`
    });
}

export async function initModeratorPanel(client: Client) {
  if (!client.user) return;

  for (const guild of client.guilds.cache.values()) {
    let modChannel = guild.channels.cache.find(
      (c) =>
        c.type === 0 && // GUILD_TEXT
        c.name === "moderator-panel"
    ) as TextChannel;

    if (!modChannel) {
      modChannel = await guild.channels.create({
        name: "moderator-panel",
        type: 0,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: ["ViewChannel"] }
        ]
      });
    }

    // --- Fetch wiadomości z kanału, aby sprawdzić, czy embed już istnieje ---
    const messages = await modChannel.messages.fetch({ limit: 50 });
    let dateEmbedMessage: Message | undefined = messages.find((m) =>
      m.embeds.length > 0 && m.embeds[0].title === "📅 Accepted Date & Time Formats"
    );

    const dateEmbed = renderDateFormatsEmbed();

    if (dateEmbedMessage) {
      // --- Edytujemy istniejący embed ---
      await dateEmbedMessage.edit({ embeds: [dateEmbed] });
    } else {
      // --- Wysyłamy nowy embed, jeśli go nie ma ---
      dateEmbedMessage = await modChannel.send({ embeds: [dateEmbed] });
    }

    // --- Render root hub w tym kanale ---
    await renderModeratorHub(modChannel);

    // Tutaj możesz zapisać do Google Sheets:
    // - ID kanału: modChannel.id
    // - ID wiadomości z embedem: dateEmbedMessage.id
    // Możesz użyć helperów typu updateConfigCell
  }

  // Globalny listener na przyciski ModeratorPanel
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    switch (interaction.customId) {
      case "moderator_event_menu":
        await handleEventMenu(interaction);
        break;
      case "moderator_points_menu":
        await handlePointsMenu(interaction);
        break;
      case "moderator_translate_menu":
        await handleTranslateMenu(interaction);
        break;
      case "moderator_absence_menu":
        await handleAbsenceMenu(interaction);
        break;
      case "moderator_help":
        await handleModeratorHelp(interaction);
        break;
    }
  });
}

// Funkcja renderująca root panel / hub w kanale moderator-panel
export async function renderModeratorHub(channel: TextChannel) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("moderator_event_menu")
      .setLabel("Event Menu")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("moderator_points_menu")
      .setLabel("Points Menu")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("moderator_translate_menu")
      .setLabel("Translate Menu")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("moderator_absence_menu")
      .setLabel("Absence Menu")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("moderator_help")
      .setLabel("Help")
      .setStyle(ButtonStyle.Secondary)
  );

  // --- Można też sprawdzić istniejącą wiadomość z hubem i edytować ją ---
  await channel.send({
    content: "📌 **Moderator Panel**",
    components: [row]
  });
}