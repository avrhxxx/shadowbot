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

  if (!entries || entries.length === 0) {
    await interaction.reply({
      content: "❌ No data to save.",
      ephemeral: true,
    });
    return;
  }

  if (!session.parserType) {
    await interaction.reply({
      content: "❌ Parser type not detected.",
      ephemeral: true,
    });
    return;
  }

  try {
    // ✅ NOWY SYSTEM (payload)
    await processQuickAdd({
      parserType: session.parserType,
      entries,
      guildId,
      targetId: eventId, // 🔥 kluczowe
    });

    await interaction.reply({
      content: `✅ Data assigned to event.`,
      ephemeral: true,
    });

    // 🧹 cleanup
    SessionData.clear(guildId);
    SessionManager.endSession(guildId);

    // 🗑️ delete channel
    setTimeout(async () => {
      try {
        const channel = await interaction.guild?.channels.fetch(
          session.channelId
        );

        if (channel && "delete" in channel) {
          await channel.delete();
        }
      } catch (err) {
        console.error("Delete error:", err);
      }
    }, 2000);

  } catch (err) {
    console.error(err);

    await interaction.reply({
      content: "❌ Error while saving.",
      ephemeral: true,
    });
  }
}