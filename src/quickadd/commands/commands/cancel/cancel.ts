// =====================================
// 📁 src/quickadd/commands/cancel/cancel.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("COMMAND");

export async function cancelCommand(
  interaction: ChatInputCommandInteraction
) {
  const guildId = interaction.guild!.id;
  const userId = interaction.user.id;
  const channelId = interaction.channelId;

  log("cancel_attempt", {
    guildId,
    userId,
    channelId,
  });

  const session = QuickAddSession.get(guildId);

  // =============================
  // ❌ NO SESSION
  // =============================
  if (!session) {
    log.warn("cancel_no_session", { guildId });

    return interaction.editReply({
      content: "❌ No active session",
    });
  }

  // =============================
  // ❌ WRONG CHANNEL
  // =============================
  if (!QuickAddSession.isInSession(guildId, channelId)) {
    log.warn("cancel_wrong_channel", {
      guildId,
      channelId,
      expected: session.threadId,
    });

    return interaction.editReply({
      content: "❌ This command must be used inside the session thread",
    });
  }

  // =============================
  // ❌ NOT OWNER
  // =============================
  if (!QuickAddSession.isOwner(guildId, userId)) {
    log.warn("cancel_not_owner", {
      guildId,
      userId,
      owner: session.ownerId,
    });

    return interaction.editReply({
      content: "❌ Only session owner can cancel",
    });
  }

  // =============================
  // ⚠️ NOT IN CONFIRM
  // =============================
  if (session.stage !== "CONFIRM_PENDING") {
    log.warn("cancel_not_in_confirm", {
      guildId,
      stage: session.stage,
    });

    return interaction.editReply({
      content: "❌ Nothing to cancel",
    });
  }

  // =============================
  // 🔄 RESET CONFIRM STATE
  // =============================
  session.stage = "COLLECTING";
  session.finalPreview = undefined;
  session.confirmStartedAt = undefined;

  log("cancel_success", {
    guildId,
    userId,
  });

  return interaction.editReply({
    content:
`↩️ **Confirmation cancelled**

🧠 You can continue adding data  
or run \`/q confirm\` again when ready`,
  });
}