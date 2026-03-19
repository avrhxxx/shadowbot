// src/quickadd/interactions/eventSelectHandler.ts

import { StringSelectMenuInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";
import { processQuickAdd } from "../services/QuickAddService";

export async function handleEventSelect(
  interaction: StringSelectMenuInteraction
) {
  if (interaction.customId !== "quickadd_select_event") return;

  const guildId = interaction.guildId!;
  const session = SessionManager.getSession(guildId);

  if (!session) {
    await interaction.reply({
      content: "❌ Session expired.",
      ephemeral: true,
    });
    return;
  }

  const eventId = interaction.values[0];
  const entries = SessionData.getEntries(guildId);

  try {
    // 🔥 TU będzie później realna integracja
    await processQuickAdd(session.parserType!, entries);

    await interaction.reply({
      content: `✅ Data assigned to event (ID: ${eventId})`,
      ephemeral: true,
    });

    // 🧹 cleanup
    SessionData.clear(guildId);
    SessionManager.endSession(guildId);

  } catch (err) {
    console.error(err);

    await interaction.reply({
      content: "❌ Error while saving.",
      ephemeral: true,
    });
  }
}