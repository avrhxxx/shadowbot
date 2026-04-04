// =====================================
// 📁 src/systems/events/main/event.main.slash.ts
// =====================================

import { SlashCommandBuilder } from "discord.js";

export const eventMainSlash = new SlashCommandBuilder()
  .setName("event")
  .setDescription("Open the Event Panel");