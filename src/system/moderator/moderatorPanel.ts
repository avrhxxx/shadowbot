// src/moderatorPanel/moderatorPanel.ts
import {
  Client,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  EmbedBuilder,
  Message,
  Guild,
  ChannelType
} from "discord.js";

import { handleModeratorHelp } from "./moderatorButtons/moderatorHelp";
import { handleEventMenu } from "./moderatorButtons/eventMenu";
import { handlePointsMenu } from "./moderatorButtons/pointsMenu";
import { handleTranslateMenu } from "./moderatorButtons/translateMenu";
import { handleAbsenceMenu } from "./moderatorButtons/absenceMenu";

import { SheetRepository } from "../google/SheetRepository";
import crypto from "crypto";

// =============================
// TYPES
// =============================
interface ModeratorPanelConfig {
  id?: string;
  modChannelId?: string;
  updateChannelId?: string;
  dateEmbedId?: string;
  hubMessageId?: string;
  version?: string;
  lastUpdated?: number;
}

// =============================
// REPO
// =============================
const repo = new SheetRepository<ModeratorPanelConfig>("moderator_config");

// =============================
// HELPERS
// =============================
async function getConfig(): Promise<ModeratorPanelConfig> {
  const all = await repo.findAll();
  return all[0] || {};
}

async function updateConfig(partial: Partial<ModeratorPanelConfig>) {
  const existing = await getConfig();

  if (!existing.id) {
    await repo.create({
      id: crypto.randomUUID(),
      ...partial
    });
    return;
  }

  await repo.updateById(existing.id, partial);
}

// ---- EMBED ----
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
      "✨ Tip: Don’t overthink it — just type it straight!\n\n" +
      `⏱ Last Update: <t:${unixTimestamp}:F>`
    )
    .setColor("Blue");
}

// ---- HUB ----
function renderModeratorHubRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("moderator_event_menu").setLabel("Event Menu").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("moderator_points_menu").setLabel("Points Menu").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("moderator_absence_menu").setLabel("Absence Menu").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("moderator_translate_menu").setLabel("Translate Menu").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("moderator_help").setLabel("Help").setStyle(ButtonStyle.Success)
  );
}

function formatVersion(num: number): string {
  const major = Math.floor(num / 100);
  const minor = Math.floor((num % 100) / 10);
  const patch = num % 10;
  return `${major}.${minor}.${patch}`;
}

// ---- SYNC ----
async function syncModeratorPanel(modChannel: TextChannel, messages: Map<string, Message>) {
  if (!messages.get("dateEmbed")) {
    const msg = await modChannel.send({ embeds: [renderDateFormatsEmbed()] });
    await updateConfig({ dateEmbedId: msg.id });
  }

  if (!messages.get("hubMessage")) {
    const msg = await modChannel.send({
      content: "📌 **Moderator Panel**",
      components: [renderModeratorHubRow()]
    });
    await updateConfig({ hubMessageId: msg.id });
  }
}

// ---- CLEANUP ----
async function cleanupDeletedChannels(guild: Guild, config: ModeratorPanelConfig) {
  if (config.modChannelId && !guild.channels.cache.get(config.modChannelId)) {
    await updateConfig({
      modChannelId: "",
      dateEmbedId: "",
      hubMessageId: ""
    });
  }

  if (config.updateChannelId && !guild.channels.cache.get(config.updateChannelId)) {
    await updateConfig({
      updateChannelId: ""
    });
  }
}

// ---- INIT ----
export async function initModeratorPanel(client: Client) {
  if (!client.user) return;

  for (const guild of client.guilds.cache.values()) {
    let config = await getConfig();

    await cleanupDeletedChannels(guild, config);

    let modChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name === "moderator-panel"
    ) as TextChannel | undefined;

    let updatesChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name === "bot-updates"
    ) as TextChannel | undefined;

    if (!modChannel) {
      modChannel = await guild.channels.create({
        name: "moderator-panel",
        type: ChannelType.GuildText
      });

      await updateConfig({ modChannelId: modChannel.id });
    }

    if (!updatesChannel) {
      updatesChannel = await guild.channels.create({
        name: "bot-updates",
        type: ChannelType.GuildText
      });

      await updateConfig({ updateChannelId: updatesChannel.id });
    }

    const fetched = await modChannel.messages.fetch({ limit: 50 });

    const map = new Map<string, Message>();

    const dateMsg = fetched.find(
      (m) => m.embeds[0]?.title === "📅 Accepted Date & Time Formats"
    );

    const hubMsg = fetched.find(
      (m) => m.content === "📌 **Moderator Panel**"
    );

    if (dateMsg) map.set("dateEmbed", dateMsg);
    if (hubMsg) map.set("hubMessage", hubMsg);

    let updated = false;

    if (dateMsg) {
      await dateMsg.edit({ embeds: [renderDateFormatsEmbed()] });
      updated = true;
    }

    if (hubMsg) {
      await hubMsg.edit({ components: [renderModeratorHubRow()] });
      updated = true;
    }

    await syncModeratorPanel(modChannel, map);

    config = await getConfig();

    let versionNum = config.version
      ? Number(config.version.split(".").join(""))
      : 100;

    if (updated) {
      versionNum++;
      const unix = Math.floor(Date.now() / 1000);

      await updatesChannel.send({
        content: `Shadow Bot updated → v${formatVersion(versionNum)}\n<t:${unix}:F>`
      });

      await updateConfig({
        version: formatVersion(versionNum),
        lastUpdated: unix
      });
    }

    setInterval(async () => {
      const fetched = await modChannel!.messages.fetch({ limit: 50 });

      const map = new Map<string, Message>();

      const dateMsg = fetched.find((m) => m.embeds[0]?.title);
      const hubMsg = fetched.find((m) => m.content === "📌 **Moderator Panel**");

      if (dateMsg) map.set("dateEmbed", dateMsg);
      if (hubMsg) map.set("hubMessage", hubMsg);

      await syncModeratorPanel(modChannel!, map);
    }, 60000);
  }
}

// =============================
// 🚀 INTERACTION HANDLER (FOR SYSTEM ROUTER)
// =============================

export async function handleModeratorInteraction(
  interaction: Interaction
): Promise<boolean> {
  if (!interaction.isButton()) return false;

  try {
    switch (interaction.customId) {
      case "moderator_event_menu":
        await handleEventMenu(interaction);
        return true;

      case "moderator_points_menu":
        await handlePointsMenu(interaction);
        return true;

      case "moderator_translate_menu":
        await handleTranslateMenu(interaction);
        return true;

      case "moderator_absence_menu":
        await handleAbsenceMenu(interaction);
        return true;

      case "moderator_help":
        await handleModeratorHelp(interaction);
        return true;
    }

    return false;
  } catch (error) {
    console.error("Error handling moderator interaction:", error);

    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "❌ An error occurred while processing this interaction.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "❌ An error occurred while processing this interaction.",
          ephemeral: true,
        });
      }
    }

    return true;
  }
}