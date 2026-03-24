// =====================================
// 📁 src/quickadd/commands/commands/fix/fix.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { formatPreview } from "../../../utils/formatPreview";
import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("COMMAND");

export async function fixCommand(
  interaction: ChatInputCommandInteraction
) {
  const guildId = interaction.guild!.id;
  const userId = interaction.user.id;
  const channelId = interaction.channelId;

  log("fix_attempt", {
    guildId,
    userId,
    channelId,
  });

  const session = QuickAddSession.get(guildId);

  if (!session) {
    return interaction.editReply({
      content: "❌ No active session",
    });
  }

  if (!QuickAddSession.isInSession(guildId, channelId)) {
    return interaction.editReply({
      content: "❌ This command must be used inside the session thread",
    });
  }

  if (!QuickAddSession.isOwner(guildId, userId)) {
    return interaction.editReply({
      content: "❌ Only session owner can use this command",
    });
  }

  const entries = QuickAddBuffer.getEntries(guildId);

  if (!entries.length) {
    return interaction.editReply({
      content: "⚠️ No data to fix",
    });
  }

  let fixedCount = 0;

  const updated = entries.map((entry: any) => {
    // =====================================
    // 🔒 CONDITIONS
    // =====================================
    if (
      entry.suggestion &&
      entry.confidence >= 0.7 &&
      entry.status !== "INVALID_VALUE"
    ) {
      if (entry.nickname !== entry.suggestion) {
        fixedCount++;

        return {
          ...entry,
          nickname: entry.suggestion,
          status: "OK", // 🔥 reset status
          confidence: 1.0,
        };
      }
    }

    return entry;
  });

  // =====================================
  // 🔥 SAVE BACK TO BUFFER
  // =====================================
  QuickAddBuffer.setEntries(guildId, updated);

  const preview = formatPreview(updated);

  return interaction.editReply({
    content:
`🛠️ **Auto-fix applied**

✅ Fixed entries: ${fixedCount}

${preview}`,
  });
}