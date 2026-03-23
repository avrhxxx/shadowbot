// =====================================
// 📁 src/quickadd/commands/commands/end/end.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("COMMAND");

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

  // =====================================
  // 🛑 END SESSION + CLEAR BUFFER
  // =====================================
  QuickAddSession.end(guildId);
  QuickAddBuffer.clear(guildId);

  log("end_success", {
    user: interaction.user.id,
    threadId: session.threadId,
  });

  // =====================================
  // 🧵 DELETE THREAD (SAFE DELAY)
  // =====================================
  try {
    const channel = interaction.client.channels.cache.get(session.threadId);

    if (channel && channel.isThread()) {
      log("thread_delete_scheduled", {
        threadId: session.threadId,
      });

      setTimeout(async () => {
        try {
          await channel.delete();

          log("thread_deleted", {
            threadId: session.threadId,
          });
        } catch (err) {
          log.warn("thread_delete_failed", err);
        }
      }, 15000);
    } else {
      log.warn("thread_not_found_or_invalid", {
        threadId: session.threadId,
      });
    }
  } catch (err) {
    log.warn("thread_delete_error", err);
  }

  return interaction.editReply({
    content: 
`🛑 Session ended

🧹 This thread will be deleted in 15 seconds.`,
  });
}