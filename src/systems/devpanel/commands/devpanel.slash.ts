// =====================================
// 📁 src/systems/devpanel/commands/devpanel.slash.ts
// =====================================

import { SlashCommandBuilder } from "discord.js";

export const devpanelSlash = new SlashCommandBuilder()
  .setName("devpanel")
  .setDescription("Open dev panel");
