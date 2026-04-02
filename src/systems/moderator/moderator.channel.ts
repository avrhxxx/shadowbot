// =====================================
// 📁 src/systems/moderator/moderator.channel.ts
// =====================================

import { TextChannel, Guild } from "discord.js";
import { renderModeratorHub } from "./views/moderator.view";

// 🔹 Tworzy lub pobiera kanał Moderator Panel
export async function setupModeratorChannel(guild: Guild): Promise<TextChannel> {
  // Szukamy istniejącego kanału o nazwie 'moderator-panel'
  let channel = guild.channels.cache.find(
    (c) => c.name === "moderator-panel" && c.isTextBased()
  ) as TextChannel;

  if (!channel) {
    // Tworzymy kanał jeśli go nie ma
    channel = await guild.channels.create({
      name: "moderator-panel",
      type: 0, // GUILD_TEXT
      topic: "Moderator Panel",
    });
  }

  return channel;
}

// 🔹 Renderuje Moderator Panel w kanale
export async function renderModeratorPanelInChannel(channel: TextChannel) {
  const view = await renderModeratorHub();

  await channel.send({
    content: view.content,
    components: view.components,
  });
}

// 🔹 Pomocnicza funkcja do inicjalizacji na serwerze
export async function initModeratorPanelForGuild(guild: Guild) {
  const channel = await setupModeratorChannel(guild);
  await renderModeratorPanelInChannel(channel);
}