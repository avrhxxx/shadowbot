// =====================================
// 📁 src/systems/devpanel/devpanel.channel.ts
// =====================================

import { TextChannel, Guild, Message } from "discord.js";
import { devpanelMainView } from "./views/devpanel.view";
import { GoogleRepository } from "@/integrations/google/googleRepository";
import { DEVPANEL_CONFIG_SHEET } from "@/integrations/google/googleSchema";

// 🔹 Repo dla DevPanel Config
const devpanelRepo = new GoogleRepository(DEVPANEL_CONFIG_SHEET);

// 🔹 Tworzy lub pobiera kanał Dev Panel
export async function setupDevPanelChannel(guild: Guild): Promise<TextChannel> {
  let channel = guild.channels.cache.find(
    (c) => c.name === "dev-panel" && c.isTextBased()
  ) as TextChannel;

  if (!channel) {
    channel = await guild.channels.create({
      name: "dev-panel",
      type: 0, // GUILD_TEXT
      topic: "Development Panel",
    });
  }

  return channel;
}

// 🔹 Renderuje lub aktualizuje Dev Panel w kanale
export async function renderDevPanelInChannel(channel: TextChannel, guildId: string) {
  const view = await devpanelMainView();

  // Sprawdzamy w Google Sheets czy istnieje hubMessageId
  let config = await devpanelRepo.findAll({ guildId });
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
      await devpanelRepo.updateById(config[0].id, {
        hubMessageId: message.id,
        channelId: channel.id,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      await devpanelRepo.create({
        id: `${guildId}-devpanel`,
        guildId,
        channelId: channel.id,
        hubMessageId: message.id,
        lastUpdated: new Date().toISOString(),
      });
    }
  }
}

// 🔹 Pomocnicza funkcja do inicjalizacji na serwerze
export async function initDevPanelForGuild(guild: Guild) {
  const channel = await setupDevPanelChannel(guild);
  await renderDevPanelInChannel(channel, guild.id);
}