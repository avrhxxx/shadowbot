import { SlashCommandBuilder } from "discord.js";

export const moderatorSlash = new SlashCommandBuilder()
  .setName("moderator")
  .setDescription("Open moderator panel");