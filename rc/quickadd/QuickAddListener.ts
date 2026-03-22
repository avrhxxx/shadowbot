// src/quickadd/QuickAddListener.ts

import { Client } from "discord.js";

export function registerQuickAddListener(client: Client) {
  client.on("messageCreate", async (message) => {
    // 🔥 placeholder
  });
}