// src/quickadd/interactions/eventSelectHandler.ts

import { StringSelectMenuInteraction } from "discord.js";
import { SessionStore } from "../session/sessionStore";
import { execute } from "../services/QuickAddPipeline";

export async function handleEventSelect(
  interaction: StringSelectMenuInteraction
) {
  if (interaction.customId !== "quickadd_select_event") return;

  const guildId = interaction.guildId!;
  const session = SessionStore.getSession(guildId);

  if (!session) {
    await interaction.reply({
      content: "❌ Session expired.",
      ephemeral: true,
    });
    return;
  }

  const eventId = interaction.values[0];
  const entries = SessionStore.getEntries(guildId);

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
    // 🔥 NOWY PIPELINE
    await execute({
      parserType: session.parserType,
      entries,
      guildId,
      targetId: eventId,
    });

    await interaction.reply({
      content: `✅ Data assigned to event.`,
      ephemeral: true,
    });

    // 🧹 cleanup
    SessionStore.clearEntries(guildId);
    SessionStore.endSession(guildId);

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