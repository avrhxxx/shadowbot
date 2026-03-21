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

import * as GS from "../googleSheetsStorage";

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
    await GS.updateModeratorPanelColumn("dateEmbedId", msg.id);
  }

  if (!messages.get("hubMessage")) {
    const msg = await modChannel.send({
      content: "📌 **Moderator Panel**",
      components: [renderModeratorHubRow()]
    });
    await GS.updateModeratorPanelColumn("hubMessageId", msg.id);
  }
}

// ---- CLEANUP ----
async function cleanupDeletedChannels(guild: Guild, modChannelId?: string, updateChannelId?: string) {
  if (modChannelId && !guild.channels.cache.get(modChannelId)) {
    await GS.updateModeratorPanelColumn("modChannelId", "");
    await GS.updateModeratorPanelColumn("dateEmbedId", "");
    await GS.updateModeratorPanelColumn("hubMessageId", "");
  }

  if (updateChannelId && !guild.channels.cache.get(updateChannelId)) {
    await GS.updateModeratorPanelColumn("updateChannelId", "");
  }
}

// ---- INIT ----
export async function initModeratorPanel(client: Client) {
  if (!client.user) return;

  for (const guild of client.guilds.cache.values()) {
    await GS.ensureModeratorConfigHeaders();
    const panelInfo = await GS.getModeratorPanelInfo();

    let modChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name === "moderator-panel"
    ) as TextChannel | undefined;

    let updatesChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name === "bot-updates"
    ) as TextChannel | undefined;

    if (panelInfo) {
      await cleanupDeletedChannels(guild, panelInfo.modChannelId, panelInfo.updateChannelId);
    }

    if (!modChannel) {
      modChannel = await guild.channels.create({
        name: "moderator-panel",
        type: ChannelType.GuildText
      });
      await GS.updateModeratorPanelColumn("modChannelId", modChannel.id);
    }

    if (!updatesChannel) {
      updatesChannel = await guild.channels.create({
        name: "bot-updates",
        type: ChannelType.GuildText
      });
      await GS.updateModeratorPanelColumn("updateChannelId", updatesChannel.id);
    }

    const fetched = await modChannel.messages.fetch({ limit: 50 });

    const map = new Map<string, Message>();

    const dateMsg = fetched.find(
      (m: Message) => m.embeds[0]?.title === "📅 Accepted Date & Time Formats"
    );

    const hubMsg = fetched.find(
      (m: Message) => m.content === "📌 **Moderator Panel**"
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

    const currentInfo = await GS.getModeratorPanelInfo();

    let versionNum = currentInfo?.version
      ? Number(currentInfo.version.split(".").join(""))
      : 100;

    if (updated) {
      versionNum++;
      const unix = Math.floor(Date.now() / 1000);

      await updatesChannel.send({
        content: `Shadow Bot updated → v${formatVersion(versionNum)}\n<t:${unix}:F>`
      });

      await GS.updateModeratorPanelColumn("version", formatVersion(versionNum));
      await GS.updateModeratorPanelColumn("lastUpdated", unix);
    }

    setInterval(async () => {
      const fetched = await modChannel!.messages.fetch({ limit: 50 });

      const map = new Map<string, Message>();

      const dateMsg = fetched.find((m: Message) => m.embeds[0]?.title);
      const hubMsg = fetched.find((m: Message) => m.content === "📌 **Moderator Panel**");

      if (dateMsg) map.set("dateEmbed", dateMsg);
      if (hubMsg) map.set("hubMessage", hubMsg);

      await syncModeratorPanel(modChannel!, map);
    }, 60000);
  }

  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    switch (interaction.customId) {
      case "moderator_event_menu": return handleEventMenu(interaction);
      case "moderator_points_menu": return handlePointsMenu(interaction);
      case "moderator_translate_menu": return handleTranslateMenu(interaction);
      case "moderator_absence_menu": return handleAbsenceMenu(interaction);
      case "moderator_help": return handleModeratorHelp(interaction);
    }
  });
}