// src/integrations/discord/discordClient.ts
import { Client } from "discord.js";

let client: Client | null = null;

export function setDiscordClient(c: Client) {
  client = c;
}

export function getDiscordClient(): Client {
  if (!client) {
    throw new Error("Discord client not initialized");
  }

  return client;
}