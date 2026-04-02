import { TextChannel, Guild, Message } from "discord.js";
import { renderModeratorHub } from "./views/moderator.view";
import { GoogleRepository } from "@/integrations/google/googleRepository";
import { MODERATOR_CONFIG_SHEET } from "@/integrations/google/googleSchema";

// Typ konfiguracji Moderator
export interface ModeratorConfig {
  id: string;
  guildId: string;
  hubMessageId?: string;
  modChannelId?: string;
  updateChannelId?: string;
  dateEmbedId?: string;
  version?: string;
  lastUpdated?: string;
}

const moderatorRepo = new GoogleRepository<ModeratorConfig>(MODERATOR_CONFIG_SHEET);

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

// 🔹 Renderuje Moderator Panel w kanale, aktualizując istniejącą wiadomość
export async function renderModeratorPanelInChannel(channel: TextChannel) {
  const config = (await moderatorRepo.findAll({ guildId: channel.guild.id }))[0];
  const view = await renderModeratorHub();

  let message: Message | null = null;

  if (config?.hubMessageId) {
    try {
      message = await channel.messages.fetch(config.hubMessageId);
      await message.edit({
        content: view.content,
        components: view.components,
      });
    } catch {
      message = await channel.send({
        content: view.content,
        components: view.components,
      });
    }

    if (!config) {
      await moderatorRepo.create({
        id: channel.guild.id,
        guildId: channel.guild.id,
        hubMessageId: message.id,
        lastUpdated: new Date().toISOString(),
      });
    } else if (message.id !== config.hubMessageId) {
      await moderatorRepo.updateById(config.id, {
        hubMessageId: message.id,
        lastUpdated: new Date().toISOString(),
      });
    }
  } else {
    message = await channel.send({
      content: view.content,
      components: view.components,
    });

    if (config) {
      await moderatorRepo.updateById(config.id, {
        hubMessageId: message.id,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      await moderatorRepo.create({
        id: channel.guild.id,
        guildId: channel.guild.id,
        hubMessageId: message.id,
        lastUpdated: new Date().toISOString(),
      });
    }
  }
}

// 🔹 Pomocnicza funkcja do inicjalizacji Moderator Panel
export async function initModeratorPanelForGuild(guild: Guild) {
  const channel = await setupModeratorChannel(guild);
  await renderModeratorPanelInChannel(channel);
}