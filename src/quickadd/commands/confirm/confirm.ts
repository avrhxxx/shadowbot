// =====================================
// 📁 src/quickadd/commands/confirm/confirm.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
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

  // =============================
  // 🧠 STAGE 1 — PREVIEW
  // =============================
  if (session.stage === "COLLECTING") {
    // 🔥 TODO: tutaj podepniesz realny preview z pipeline
    const preview = "📊 Example preview:\n- Arek\n- Allie\n- DomSugarDaddy";

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
    log("confirm_finalize", {
      guildId,
      userId,
    });

    // 🔥 TODO: tutaj podłączysz zapis do QUEUE (events / points)
    // np:
    // await enqueueEvents(session.finalPreview)

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