// =====================================
// 📁 src/systems/moderator/moderator.channel.ts
// =====================================

import { TextChannel, Guild, Message } from "discord.js";
import { renderModeratorHub } from "./views/moderator.view";
import { GoogleRepository } from "@/integrations/google/googleRepository";
import { MODERATOR_CONFIG_SHEET } from "@/integrations/google/googleSchema";

// 🔹 Repo dla Moderator Config
const moderatorRepo = new GoogleRepository(MODERATOR_CONFIG_SHEET);

// 🔹 Tworzy lub pobiera kanał Moderator Panel
export async function setupModeratorChannel(guild: Guild): Promise<TextChannel> {
  let channel = guild.channels.cache.find(
    (c) => c.name === "moderator-panel" && c.isTextBased()
  ) as TextChannel;

  if (!channel) {
    channel = await guild.channels.create({
      name: "moderator-panel",
      type: 0, // GUILD_TEXT
      topic: "Moderator Panel",
    });
  }

  return channel;
}

// 🔹 Renderuje lub aktualizuje Moderator Panel w kanale
export async function renderModeratorPanelInChannel(channel: TextChannel, guildId: string) {
  const view = await renderModeratorHub();

  // Sprawdzamy w Google Sheets czy istnieje hubMessageId
  let config = await moderatorRepo.findAll({ guildId });
  let hubMessageId = config[0]?.hubMessageId;

  let message: Message | null = null;

  if (hubMessageId) {
    try {
      message = await channel.messages.fetch(hubMessageId);
      await message.edit({
        content: view.content,
        components: view.components,
      });
    } catch {
      // Jeśli wiadomość nie istnieje lub nie można pobrać → wyślij nową
      hubMessageId = undefined;
    }
  }

  if (!hubMessageId) {
    message = await channel.send({
      content: view.content,
      components: view.components,
    });

    // Zapisz/aktualizuj hubMessageId w Google Sheets
    if (config[0]) {
      await moderatorRepo.updateById(config[0].id, {
        hubMessageId: message.id,
        updateChannelId: channel.id,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      await moderatorRepo.create({
        id: `${guildId}-moderator`,
        guildId,
        updateChannelId: channel.id,
        hubMessageId: message.id,
        lastUpdated: new Date().toISOString(),
      });
    }
  }
}

// 🔹 Pomocnicza funkcja do inicjalizacji na serwerze
export async function initModeratorPanelForGuild(guild: Guild) {
  const channel = await setupModeratorChannel(guild);
  await renderModeratorPanelInChannel(channel, guild.id);
}