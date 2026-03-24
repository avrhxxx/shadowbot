// =====================================
// 📁 src/quickadd/commands/confirm/confirm.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer"; // 🔥 NEW
import { formatPreview } from "../../../utils/formatPreview"; // 🔥 NEW
import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("COMMAND");

export async function confirmCommand(
  interaction: ChatInputCommandInteraction
) {
  const guildId = interaction.guild!.id;
  const userId = interaction.user.id;
  const channelId = interaction.channelId;

  log("confirm_attempt", {
    guildId,
    userId,
    channelId,
  });

  const session = QuickAddSession.get(guildId);

  // =============================
  // ❌ NO SESSION
  // =============================
  if (!session) {
    log.warn("confirm_no_session", { guildId });

    return interaction.editReply({
      content: "❌ No active session",
    });
  }

  // =============================
  // ❌ WRONG CHANNEL
  // =============================
  if (!QuickAddSession.isInSession(guildId, channelId)) {
    log.warn("confirm_wrong_channel", {
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
    log.warn("confirm_not_owner", {
      guildId,
      userId,
      owner: session.ownerId,
    });

    return interaction.editReply({
      content: "❌ Only session owner can confirm",
    });
  }

  // =====================================
  // 📊 GET BUFFER
  // =====================================
  const entries = QuickAddBuffer.getEntries(guildId);

  if (!entries.length) {
    return interaction.editReply({
      content: "⚠️ No data to confirm",
    });
  }

  // =====================================
  // ❌ VALIDATION BLOCKER
  // =====================================
  const invalidEntries = entries.filter(
    (e: any) => e.status && e.status !== "OK"
  );

  // =============================
  // 🧠 STAGE 1 — PREVIEW
  // =============================
  if (session.stage === "COLLECTING") {
    if (invalidEntries.length > 0) {
      log.warn("confirm_blocked_invalid_entries", {
        count: invalidEntries.length,
      });

      const preview = formatPreview(entries);

      return interaction.editReply({
        content:
`❌ **Cannot confirm — invalid entries detected**

${preview}

👉 Fix entries using:
/q adjust`,
      });
    }

    // ✅ ALL GOOD → proceed
    const preview = formatPreview(entries);

    session.stage = "CONFIRM_PENDING";
    session.finalPreview = preview;
    session.confirmStartedAt = Date.now();

    log("confirm_stage_enter", {
      guildId,
      userId,
    });

    return interaction.editReply({
      content:
`⚠️ **CONFIRMATION REQUIRED**

${preview}

❗ This data will be sent to the system.

👉 Type \`/q confirm\` again to finalize  
👉 Or use \`/q cancel\` to abort`,
    });
  }

  // =============================
  // 🧠 STAGE 2 — FINAL CONFIRM
  // =============================
  if (session.stage === "CONFIRM_PENDING") {
    // 🔥 SAFETY CHECK AGAIN
    if (invalidEntries.length > 0) {
      log.warn("confirm_blocked_on_finalize", {
        count: invalidEntries.length,
      });

      return interaction.editReply({
        content:
`❌ Data changed or invalid entries detected.

👉 Fix issues before confirming again.`,
      });
    }

    log("confirm_finalize", {
      guildId,
      userId,
    });

    // 🔥 TODO: tutaj podłączysz zapis do QUEUE

    // reset stage
    session.stage = "COLLECTING";
    session.finalPreview = undefined;
    session.confirmStartedAt = undefined;

    return interaction.editReply({
      content:
`✅ **Data confirmed and sent**

🚀 Processing started`,
    });
  }

  // =============================
  // ❌ FALLBACK
  // =============================
  log.warn("confirm_invalid_stage", {
    guildId,
    stage: session.stage,
  });

  return interaction.editReply({
    content: "❌ Invalid session state",
  });
}