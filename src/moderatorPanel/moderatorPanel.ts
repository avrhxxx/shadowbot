import {
  Client,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  EmbedBuilder,
  Message,
  Guild
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
  ensureModeratorConfigHeaders
} from "../googleSheetsStorage";

// ---- helper do embedu z formatami dat ----
function renderDateFormatsEmbed(): EmbedBuilder {
  const unixTimestamp = Math.floor(Date.now() / 1000);
  return new EmbedBuilder()
    .setTitle("📅 Accepted Date & Time Formats")
    .setDescription(
      "💡 Some forms require full date & time, others just day/month.\n\n" +
      "🕰 **Full Date + Time Examples**\n" +
      "- 18.07 20:30\n" +
      "- 18/07 20:30\n" +
      "- 18072030\n\n" +
      "📆 **Day & Month Only**\n" +
      "- 18.07\n" +
      "- 18/07\n" +
      "- 1807\n\n" +
      "📅 **Year Only**\n" +
      "- 2026\n\n" +
      "✨ Tip: Don’t overthink it — just type it straight!"
    )
    .setFooter({ text: `Last Update: <t:${unixTimestamp}:F>` })
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

// --- Usuwanie ID z Google Sheets, jeśli kanał nie istnieje ---
async function cleanupDeletedChannels(guild: Guild, modChannelId: string, updateChannelId: string) {
  const modChannel = guild.channels.cache.get(modChannelId);
  const updatesChannel = guild.channels.cache.get(updateChannelId);

  if (!modChannel) {
    await updateModeratorPanelColumn("modChannelId", "");
    await updateModeratorPanelColumn("dateEmbedId", "");
    await updateModeratorPanelColumn("hubMessageId", "");
  }

  if (!updatesChannel) {
    await updateModeratorPanelColumn("updateChannelId", "");
  }
}

// --- Inicjalizacja panelu moderatora ---
export async function initModeratorPanel(client: Client) {
  if (!client.user) return;

  for (const guild of client.guilds.cache.values()) {
    // --- Szukamy kanału moderator-panel ---
    let modChannel = guild.channels.cache.find(c => c.type === 0 && c.name === "moderator-panel") as TextChannel;
    let updatesChannel = guild.channels.cache.find(c => c.type === 0 && c.name === "bot-updates") as TextChannel;

    // --- Tworzymy nagłówki w Google Sheets jeśli nie istnieją ---
    await ensureModeratorConfigHeaders();
    const panelInfo = await getModeratorPanelInfo();

    // --- Sprawdzenie czy kanały istnieją, jeśli nie usuń ID ---
    if (panelInfo) {
      await cleanupDeletedChannels(guild, panelInfo.modChannelId, panelInfo.updateChannelId);
    }

    if (!modChannel) {
      modChannel = await guild.channels.create({
        name: "moderator-panel",
        type: 0,
        permissionOverwrites: [{ id: guild.roles.everyone.id, deny: ["ViewChannel"] }]
      });
      await updateModeratorPanelColumn("modChannelId", modChannel.id);
    }

    if (!updatesChannel) {
      updatesChannel = await guild.channels.create({
        name: "bot-updates",
        type: 0,
        permissionOverwrites: [{ id: guild.roles.everyone.id, deny: ["ViewChannel"] }]
      });
      await updateModeratorPanelColumn("updateChannelId", updatesChannel.id);
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

    if (embedUpdated || hubUpdated) {
      newVersionNum = currentVersionNum + 1;
      const unixTimestamp = Math.floor(Date.now() / 1000);
      await updatesChannel.send({
        content: `Shadow Bot has been updated! Bot version: v${formatVersion(newVersionNum)}\n<t:${unixTimestamp}:F>`
      });
      await updateModeratorPanelColumn("version", formatVersion(newVersionNum));
      await updateModeratorPanelColumn("lastUpdated", unixTimestamp);
    }

    // --- Interwał automatycznego sprawdzania rollbacku co minutę ---
    setInterval(async () => {
      const fetched = await modChannel.messages.fetch({ limit: 50 });
      const map = new Map<string, Message>();
      const dateMsg = fetched.find(m => m.embeds.length > 0 && m.embeds[0].title === "📅 Accepted Date & Time Formats");
      const hub = fetched.find(m => m.content === "📌 **Moderator Panel**");
      if (dateMsg) map.set("dateEmbed", dateMsg);
      if (hub) map.set("hubMessage", hub);
      await syncModeratorPanel(modChannel, map);

      // --- Sprawdzenie czy kanały nadal istnieją ---
      if (panelInfo) {
        await cleanupDeletedChannels(guild, panelInfo.modChannelId, panelInfo.updateChannelId);
      }
    }, 60_000);
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
}