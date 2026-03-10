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

import { handleModeratorHelp } from "./moderatorButtons/moderatorHelp";
import { handleEventMenu } from "./moderatorButtons/eventMenu";
import { handlePointsMenu } from "./moderatorButtons/pointsMenu";
import { handleTranslateMenu } from "./moderatorButtons/translateMenu";
import { handleAbsenceMenu } from "./moderatorButtons/absenceMenu";
import {
  saveModeratorPanelInfo,
  updateModeratorPanelColumn,
  getModeratorPanelInfo,
  readModeratorConfig,
  writeSheet
} from "../googleSheetsStorage";

// ---- helper do embedu z formatami dat ----
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
      { name: "Tip", value: "No need for magic wands — just type it straight! ✨" },
      { name: "Last Update", value: `<t:${unixTimestamp}:F>` }
    )
    .setColor("Blue");
}

// --- helper do renderu hubu / root panel ---
function renderModeratorHubRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
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
}

// --- pomocnicza funkcja do formatowania wersji numerowej ---
function formatVersion(num: number): string {
  const major = Math.floor(num / 100);
  const minor = Math.floor((num % 100) / 10);
  const patch = num % 10;
  return `${major}.${minor}.${patch}`;
}

// --- Funkcja do automatycznego rollbacku panelu ---
async function syncModeratorPanel(modChannel: TextChannel, messages: Map<string, Message>) {
  const dateEmbedMessage = messages.get("dateEmbed");
  const hubMessage = messages.get("hubMessage");

  // Embed daty
  if (!dateEmbedMessage) {
    const newEmbedMsg = await modChannel.send({ embeds: [renderDateFormatsEmbed()] });
    await updateModeratorPanelColumn("dateEmbedId", newEmbedMsg.id);
  }

  // Hub
  if (!hubMessage) {
    const newHubMsg = await modChannel.send({
      content: "📌 **Moderator Panel**",
      components: [renderModeratorHubRow()]
    });
    await updateModeratorPanelColumn("hubMessageId", newHubMsg.id);
  }
}

// --- Funkcja do rollbacku w interwale ---
async function intervalModeratorPanelCheck(client: Client) {
  for (const guild of client.guilds.cache.values()) {
    const modChannel = guild.channels.cache.find(c => c.type === 0 && c.name === "moderator-panel") as TextChannel;
    if (!modChannel) continue;

    const fetchedMessages = await modChannel.messages.fetch({ limit: 50 });
    const messagesMap = new Map<string, Message>();

    const dateEmbedMsg = fetchedMessages.find(m => m.embeds.length > 0 && m.embeds[0].title === "📅 Accepted Date & Time Formats");
    const hubMsg = fetchedMessages.find(m => m.content === "📌 **Moderator Panel**");

    if (dateEmbedMsg) messagesMap.set("dateEmbed", dateEmbedMsg);
    if (hubMsg) messagesMap.set("hubMessage", hubMsg);

    // Wysyłamy rollback brakujących wiadomości bez wersjonowania
    await syncModeratorPanel(modChannel, messagesMap);
  }
}

// --- Inicjalizacja panelu moderatora ---
export async function initModeratorPanel(client: Client) {
  if (!client.user) return;

  for (const guild of client.guilds.cache.values()) {
    // --- Szukamy kanału moderator-panel ---
    let modChannel = guild.channels.cache.find(c => c.type === 0 && c.name === "moderator-panel") as TextChannel;
    if (!modChannel) {
      modChannel = await guild.channels.create({
        name: "moderator-panel",
        type: 0,
        permissionOverwrites: [{ id: guild.roles.everyone.id, deny: ["ViewChannel"] }]
      });
    }

    // --- Szukamy kanału bot-updates ---
    let updatesChannel = guild.channels.cache.find(c => c.type === 0 && c.name === "bot-updates") as TextChannel;
    if (!updatesChannel) {
      updatesChannel = await guild.channels.create({
        name: "bot-updates",
        type: 0,
        permissionOverwrites: [{ id: guild.roles.everyone.id, deny: ["ViewChannel"] }]
      });
      await updateModeratorPanelColumn("updateChannelId", updatesChannel.id);
    }

    // --- Tworzymy nagłówki w Google Sheets jeśli nie istnieją ---
    const headers = ["modChannelId","dateEmbedId","hubMessageId","updateChannelId","lastUpdated","version"];
    const rows = await readModeratorConfig();
    if (!rows || rows.length === 0) {
      await writeSheet("moderator_config", [headers, ["", "", "", "", 0, "1.0.0"]]);
    }

    // --- Fetch wiadomości z moderator-panel ---
    const fetchedMessages = await modChannel.messages.fetch({ limit: 50 });
    const messagesMap = new Map<string, Message>();

    const dateEmbedMsg = fetchedMessages.find(m => m.embeds.length > 0 && m.embeds[0].title === "📅 Accepted Date & Time Formats");
    const hubMsg = fetchedMessages.find(m => m.content === "📌 **Moderator Panel**");

    if (dateEmbedMsg) messagesMap.set("dateEmbed", dateEmbedMsg);
    if (hubMsg) messagesMap.set("hubMessage", hubMsg);

    let embedUpdated = false;
    let hubUpdated = false;

    // --- Aktualizacja istniejących wiadomości ---
    if (dateEmbedMsg) {
      await dateEmbedMsg.edit({ embeds: [renderDateFormatsEmbed()] });
      embedUpdated = true;
    }

    if (hubMsg) {
      await hubMsg.edit({ components: [renderModeratorHubRow()] });
      hubUpdated = true;
    }

    // --- Automatyczny rollback brakujących wiadomości ---
    await syncModeratorPanel(modChannel, messagesMap);

    // --- Pobierz wersję i timestamp z Google Sheets ---
    const currentInfo = await getModeratorPanelInfo();
    let currentVersionNum = currentInfo?.version
      ? Number(currentInfo.version.split('.').join(''))
      : 100; // 1.0.0
    let newVersionNum = currentVersionNum;

    // --- Jeśli faktyczna edycja, zwiększamy wersję i wysyłamy update ---
    if (embedUpdated || hubUpdated) {
      newVersionNum = currentVersionNum + 1;
      const unixTimestamp = Math.floor(Date.now() / 1000);
      await updatesChannel.send({
        content: `Moderator Panel has been refreshed! Bot version: v${formatVersion(newVersionNum)}\n<t:${unixTimestamp}:F>`
      });
      await updateModeratorPanelColumn("version", formatVersion(newVersionNum));
      await updateModeratorPanelColumn("lastUpdated", unixTimestamp);
    }
  }

  // --- Globalny listener przycisków ---
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    switch (interaction.customId) {
      case "moderator_event_menu": await handleEventMenu(interaction); break;
      case "moderator_points_menu": await handlePointsMenu(interaction); break;
      case "moderator_translate_menu": await handleTranslateMenu(interaction); break;
      case "moderator_absence_menu": await handleAbsenceMenu(interaction); break;
      case "moderator_help": await handleModeratorHelp(interaction); break;
    }
  });

  // --- Interwał co minutę na rollback brakujących wiadomości ---
  setInterval(async () => {
    try {
      await intervalModeratorPanelCheck(client);
    } catch (err) {
      console.error("Moderator panel rollback check failed:", err);
    }
  }, 60 * 1000); // co 1 minutę
}