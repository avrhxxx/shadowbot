// =====================================
// 📁 src/systems/moderator/commands/moderator.slash.ts
// =====================================

import { SlashCommandBuilder } from "discord.js";

export const moderatorSlash = new SlashCommandBuilder()
  .setName("moderator")
  .setDescription("Open moderator panel");