// =====================================
// 📁 src/systems/devpanel/devpanel.channel.ts
// =====================================

import { TextChannel, Guild } from "discord.js";
import { devpanelMainView } from "./views/devpanel.view";

// 🔹 Tworzy lub pobiera kanał Dev Panel
export async function setupDevPanelChannel(guild: Guild): Promise<TextChannel> {
  // Szukamy istniejącego kanału o nazwie 'dev-panel'
  let channel = guild.channels.cache.find(
    (c) => c.name === "dev-panel" && c.isTextBased()
  ) as TextChannel;

  if (!channel) {
    // Tworzymy kanał jeśli go nie ma
    channel = await guild.channels.create({
      name: "dev-panel",
      type: 0, // GUILD_TEXT
      topic: "Development Panel",
    });
  }

  return channel;
}

// 🔹 Renderuje Dev Panel w kanale
export async function renderDevPanelInChannel(channel: TextChannel) {
  const view = await devpanelMainView();

  await channel.send({
    content: view.content,
    components: view.components,
  });
}

// 🔹 Pomocnicza funkcja do inicjalizacji na serwerze
export async function initDevPanelForGuild(guild: Guild) {
  const channel = await setupDevPanelChannel(guild);
  await renderDevPanelInChannel(channel);
}