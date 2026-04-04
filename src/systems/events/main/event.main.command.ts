// =====================================
// 📁 src/systems/events/main/event.main.command.ts
// =====================================

import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { view } from "@/ui/api";
import { eventMainPanel } from "./event.main.view";

export async function handleEventMainCommand(interaction: ChatInputCommandInteraction<CacheType>) {
  try {
    await view.show(eventMainPanel, { ephemeral: true }, { interaction });
  } catch (err) {
    console.error("Event main command failed:", err);
    await interaction.reply({ content: "⚠️ Something went wrong.", ephemeral: true });
  }
}