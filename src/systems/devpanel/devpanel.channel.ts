// ==========================
// 📂 src/systems/devpanel/devpanel.channel.ts
// ==========================

import { TextChannel, Guild, Message } from "discord.js";
import { devpanelMainView } from "./views/devpanel.view";
import { GoogleRepository } from "@/integrations/google/googleRepository";
import { DEVPANEL_CONFIG_SHEET } from "@/integrations/google/googleSchema";

// Typ konfiguracji DevPanel
export interface DevPanelConfig {
  id: string;
  guildId: string;
  hubMessageId?: string;
  lastUpdated?: string;
}

// 🔹 Używamy poprawnej nazwy importu
const devpanelRepo = new GoogleRepository<DevPanelConfig>(DEVPANEL_CONFIG_SHEET);

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

// 🔹 Renderuje Dev Panel w kanale, aktualizując istniejącą wiadomość
export async function renderDevPanelInChannel(channel: TextChannel) {
  const config = (await devpanelRepo.findAll({ guildId: channel.guild.id }))[0];
  const view = await devpanelMainView();

  let message: Message | null = null;

  if (config?.hubMessageId) {
    try {
      message = await channel.messages.fetch(config.hubMessageId);
      await message.edit({
        content: view.content,
        components: view.components,
      });
    } catch {
      // Wiadomość nie istnieje lub została usunięta
      message = await channel.send({
        content: view.content,
        components: view.components,
      });
    }

    // Aktualizacja hubMessageId w repozytorium, jeśli nowa wiadomość została wysłana
    if (!config) {
      await devpanelRepo.create({
        id: channel.guild.id,
        guildId: channel.guild.id,
        hubMessageId: message.id,
        lastUpdated: new Date().toISOString(),
      });
    } else if (message.id !== config.hubMessageId) {
      await devpanelRepo.updateById(config.id, {
        hubMessageId: message.id,
        lastUpdated: new Date().toISOString(),
      });
    }
  } else {
    // Nie ma hubMessageId w config -> wysyłamy nową wiadomość
    message = await channel.send({
      content: view.content,
      components: view.components,
    });

    if (config) {
      await devpanelRepo.updateById(config.id, {
        hubMessageId: message.id,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      await devpanelRepo.create({
        id: channel.guild.id,
        guildId: channel.guild.id,
        hubMessageId: message.id,
        lastUpdated: new Date().toISOString(),
      });
    }
  }
}

// 🔹 Pomocnicza funkcja do inicjalizacji Dev Panel
export async function initDevPanelForGuild(guild: Guild) {
  const channel = await setupDevPanelChannel(guild);
  await renderDevPanelInChannel(channel);
}