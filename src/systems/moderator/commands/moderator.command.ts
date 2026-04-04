// =====================================
// 📁 src/systems/moderator/commands/moderator.command.ts
// =====================================

import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { view } from "@/ui/api";
import { moderatorHubView } from "../views/moderator.view";

export async function handleModeratorCommand(interaction: ChatInputCommandInteraction<CacheType>) {
  try {
    // Pokaż główny widok moderatora
    await view.show(moderatorHubView, { ephemeral: true }, { interaction });
  } catch (err) {
    console.error("Moderator command failed:", err);
    await interaction.reply({ content: "⚠️ Something went wrong.", ephemeral: true });
  }
}