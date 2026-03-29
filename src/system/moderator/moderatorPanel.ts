// src/system/moderator/moderatorPanel.ts

import {
  Client,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  EmbedBuilder,
  Message,
  ChannelType
} from "discord.js";

import { handleModeratorHelp } from "./moderatorButtons/moderatorHelp";
import { handleEventMenu } from "./moderatorButtons/eventMenu";
import { handlePointsMenu } from "./moderatorButtons/pointsMenu";
import { handleTranslateMenu } from "./moderatorButtons/translateMenu";
import { handleAbsenceMenu } from "./moderatorButtons/absenceMenu";

import { SheetRepository } from "../../google/SheetRepository";
import { log } from "../../../core/logger/log";
import { TraceContext } from "../../../core/trace/TraceContext";
import crypto from "crypto"; // ✅ FIX

// =============================
// TYPES
// =============================
interface ModeratorPanelConfig {
  id?: string;
  guildId: string;
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
async function getConfig(guildId: string): Promise<ModeratorPanelConfig> {
  const all = await repo.findAll({ guildId });
  return all[0] || { guildId };
}

async function updateConfig(
  guildId: string,
  partial: Partial<ModeratorPanelConfig>
) {
  const existing = await getConfig(guildId);

  if (!existing.id) {
    await repo.create({
      id: crypto.randomUUID(), // ✅ OK (DB id, not traceId)
      guildId,
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
async function syncModeratorPanel(
  ctx: TraceContext,
  guildId: string,
  modChannel: TextChannel,
  messages: Map<string, Message>
) {
  const l = log.ctx(ctx);

  if (!messages.get("dateEmbed")) {
    const msg = await modChannel.send({ embeds: [renderDateFormatsEmbed()] });

    await updateConfig(guildId, { dateEmbedId: msg.id });

    l.event("moderator_date_embed_create", {
      guildId,
      channelId: modChannel.id,
      messageId: msg.id,
    });
  }

  if (!messages.get("hubMessage")) {
    const msg = await modChannel.send({
      content: "📌 **Moderator Panel**",
      components: [renderModeratorHubRow()]
    });

    await updateConfig(guildId, { hubMessageId: msg.id });

    l.event("moderator_hub_create", {
      guildId,
      channelId: modChannel.id,
      messageId: msg.id,
    });
  }
}

// ---- INIT ----
const startedGuilds = new Set<string>();

export async function initModeratorPanel(client: Client, ctx: TraceContext) {
  if (!client.user) return;

  const l = log.ctx(ctx);

  for (const guild of client.guilds.cache.values()) {
    if (startedGuilds.has(guild.id)) continue;
    startedGuilds.add(guild.id);

    const guildId = guild.id;

    l.event("moderator_init_start", { guildId });

    let config = await getConfig(guildId);

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

      l.event("moderator_channel_create", {
        guildId,
        channelId: modChannel.id,
        name: "moderator-panel",
      });

      await updateConfig(guildId, { modChannelId: modChannel.id });
    }

    if (!updatesChannel) {
      updatesChannel = await guild.channels.create({
        name: "bot-updates",
        type: ChannelType.GuildText
      });

      l.event("moderator_channel_create", {
        guildId,
        channelId: updatesChannel.id,
        name: "bot-updates",
      });

      await updateConfig(guildId, { updateChannelId: updatesChannel.id });
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

    await syncModeratorPanel(ctx, guildId, modChannel, map);

    config = await getConfig(guildId);

    let versionNum = config.version
      ? Number(config.version.split(".").join(""))
      : 100;

    if (updated) {
      versionNum++;
      const unix = Math.floor(Date.now() / 1000);

      await updatesChannel.send({
        content: `Shadow Bot updated → v${formatVersion(versionNum)}\n<t:${unix}:F>`
      });

      l.event("moderator_version_update", {
        guildId,
        version: formatVersion(versionNum),
      });

      await updateConfig(guildId, {
        version: formatVersion(versionNum),
        lastUpdated: unix
      });
    }

    l.event("moderator_init_success", { guildId });

    setInterval(async () => {
      try {
        const fetched = await modChannel!.messages.fetch({ limit: 50 });

        const map = new Map<string, Message>();

        const dateMsg = fetched.find((m) => m.embeds[0]?.title);
        const hubMsg = fetched.find((m) => m.content === "📌 **Moderator Panel**");

        if (dateMsg) map.set("dateEmbed", dateMsg);
        if (hubMsg) map.set("hubMessage", hubMsg);

        await syncModeratorPanel(ctx, guildId, modChannel!, map);

        l.event("moderator_interval_sync", { guildId });

      } catch (err) {
        l.error("moderator_interval_error", {
          error: err,
          guildId
        });
      }
    }, 60000);
  }
}

// =============================
// 🚀 INTERACTION HANDLER
// =============================

export async function handleModeratorInteraction(
  interaction: Interaction,
  ctx: TraceContext
): Promise<boolean> {
  if (!interaction.isButton()) return false;

  const l = log.ctx(ctx);

  try {
    const id = interaction.customId;

    l.event("moderator_button", {
      id,
      guildId: interaction.guildId,
    });

    switch (id) {
      case "moderator_event_menu":
        await handleEventMenu(interaction, ctx);
        return true;

      case "moderator_points_menu":
        await handlePointsMenu(interaction, ctx);
        return true;

      case "moderator_translate_menu":
        await handleTranslateMenu(interaction, ctx);
        return true;

      case "moderator_absence_menu":
        await handleAbsenceMenu(interaction, ctx);
        return true;

      case "moderator_help":
        await handleModeratorHelp(interaction, ctx);
        return true;
    }

    return false;
  } catch (error) {
    l.error("moderator_error", {
      error,
      guildId: interaction.guildId,
      id: interaction.isButton() ? interaction.customId : undefined,
    });

    if (interaction.isRepliable()) {
      const payload = {
        content: "❌ An error occurred while processing this interaction.",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }

    return true;
  }
}