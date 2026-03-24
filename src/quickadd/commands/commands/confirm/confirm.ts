// =====================================
// 📁 src/quickadd/commands/confirm/confirm.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { formatPreview } from "../../../utils/formatPreview";
import { createLogger } from "../../../debug/DebugLogger";

// 🔥 FIX — USE SERVICE INSTEAD OF DIRECT SHEETS
import { enqueue } from "../../../storage/QuickAddService";

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

  if (!session) {
    log.warn("confirm_no_session", { guildId });

    return interaction.editReply({
      content: "❌ No active session",
    });
  }

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

  const entries = QuickAddBuffer.getEntries(guildId);

  if (!entries.length) {
    return interaction.editReply({
      content: "⚠️ No data to confirm",
    });
  }

  const invalidEntries = entries.filter(
    (e: any) => e.status && e.status !== "OK"
  );

  // =============================
  // 🧠 STAGE 1
  // =============================
  if (session.stage === "COLLECTING") {
    if (invalidEntries.length > 0) {
      const preview = formatPreview(entries);

      return interaction.editReply({
        content:
`❌ **Cannot confirm — invalid entries detected**

${preview}

👉 Fix entries using:
/q adjust`,
      });
    }

    const preview = formatPreview(entries);

    session.stage = "CONFIRM_PENDING";
    session.finalPreview = preview;
    session.confirmStartedAt = Date.now();

    return interaction.editReply({
      content:
`⚠️ **CONFIRMATION REQUIRED**

${preview}

👉 Type \`/q confirm\` again to finalize`,
    });
  }

  // =============================
  // 🧠 STAGE 2 — FINAL
  // =============================
  if (session.stage === "CONFIRM_PENDING") {
    if (invalidEntries.length > 0) {
      return interaction.editReply({
        content: "❌ Data invalid — fix before confirming again",
      });
    }

    // =====================================
    // 🔥 QUEUE BUILD (DELEGATED)
    // =====================================
    try {
      await enqueue(
        entries.map((e) => ({
          guildId,
          type: session.type,
          nickname: e.nickname,
          value: e.value,
        }))
      );

      log("queue_enqueued", {
        count: entries.length,
        type: session.type,
      });

    } catch (err) {
      log.error("queue_failed", err);

      return interaction.editReply({
        content: "❌ Failed to enqueue data",
      });
    }

    // =====================================
    // 🔥 RESET
    // =====================================
    session.stage = "COLLECTING";
    session.finalPreview = undefined;
    session.confirmStartedAt = undefined;

    return interaction.editReply({
      content:
`✅ **Data sent to queue**

⚙️ Worker will process it shortly`,
    });
  }

  log.warn("confirm_invalid_stage", {
    guildId,
    stage: session.stage,
  });

  return interaction.editReply({
    content: "❌ Invalid session state",
  });
}