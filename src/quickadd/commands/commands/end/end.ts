// =====================================
// 📁 src/quickadd/commands/commands/end/end.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { createLogger } from "../../../debug/DebugLogger"; // 🔥 NEW

const log = createLogger("COMMAND"); // 🔥 NEW

export async function endCommand(
  interaction: ChatInputCommandInteraction
) {
  const guildId = interaction.guild!.id;

  log("end_attempt", {
    user: interaction.user.id,
    guildId,
  });

  const session = QuickAddSession.get(guildId);

  if (!session) {
    log.warn("end_no_session");

    return interaction.editReply({
      content: "❌ No active session",
    });
  }

  if (session.ownerId !== interaction.user.id) {
    log.warn("end_not_owner", {
      owner: session.ownerId,
      user: interaction.user.id,
    });

    return interaction.editReply({
      content: "❌ Only session owner can end it",
    });
  }

  QuickAddSession.end(guildId);
  QuickAddBuffer.clear(guildId);

  log("end_success", {
    user: interaction.user.id,
  });

  return interaction.editReply({
    content: "🛑 Session ended",
  });
}