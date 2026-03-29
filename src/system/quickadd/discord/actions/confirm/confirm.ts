// =====================================
// 📁 src/system/quickadd/discord/actions/confirm/confirm.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import {
  enqueuePoints,
  enqueueEvents,
} from "../../../storage/QuickAddRepository";

import {
  validateQuickAddContext,
  validateSessionOwner,
} from "../../../rules/QuickAddGuards";

import { QuickAddType } from "../../../core/QuickAddTypes";

import { log } from "../../../../core/logger/log";
import { TraceContext } from "../../../../core/trace/TraceContext";

// =====================================
// 🧠 MODE RESOLVER
// =====================================

function resolveMode(type: QuickAddType): "points" | "events" {
  if (type === "DONATIONS_POINTS" || type === "DUEL_POINTS") {
    return "points";
  }
  return "events";
}

// =====================================
// 🔐 SAFE REPLY
// =====================================

async function safeReply(
  interaction: ChatInputCommandInteraction,
  content: string
) {
  try {
    await interaction.editReply(content);
  } catch {
    if (!interaction.replied) {
      await interaction
        .reply({ content, flags: 64 })
        .catch(() => null);
    }
  }
}

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleConfirm(
  interaction: ChatInputCommandInteraction,
  ctx: TraceContext
): Promise<void> {
  const startedAt = Date.now();
  const l = log.ctx(ctx);

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: 64 });
  }

  if (!guildId) {
    await safeReply(interaction, "❌ Guild only command");
    return;
  }

  const session = QuickAddSession.get(guildId, userId);

  const contextError = validateQuickAddContext(
    interaction,
    session,
    ctx.traceId
  );

  const ownerError = validateSessionOwner(
    interaction,
    session,
    ctx.traceId
  );

  if (contextError || ownerError || !session) {
    l.warn("confirm_guard_failed", {
      sessionId: session?.sessionId,
      guildId,
      userId,
      hasSession: !!session,
      contextError,
      ownerError,
    });

    await safeReply(
      interaction,
      contextError ?? ownerError ?? "❌ Session not found"
    );
    return;
  }

  const sessionId = session.sessionId;

  try {
    l.event("confirm_start", {
      sessionId,
      stage: session.stage,
      type: session.type,
    });

    const entries = QuickAddBuffer.getEntries(sessionId, ctx.traceId);

    l.event("confirm_buffer_loaded", {
      sessionId,
      count: entries.length,
    });

    if (!entries.length) {
      l.event("confirm_empty", { sessionId });

      await safeReply(interaction, "⚠️ Nothing to confirm");
      return;
    }

    const invalid = entries.filter((e) => e.status !== "OK");

    if (invalid.length > 0) {
      l.warn("confirm_blocked_invalid", {
        sessionId,
        invalidCount: invalid.length,
      });

      await safeReply(
        interaction,
        `❌ Cannot confirm. ${invalid.length} entries are not OK.`
      );
      return;
    }

    // =============================
    // STEP 1 → ENTER CONFIRM MODE
    // =============================
    if (session.stage === "COLLECTING") {
      QuickAddSession.setStage(
        guildId,
        userId,
        "CONFIRM_PENDING",
        ctx.traceId
      );

      l.event("confirm_stage_entered", {
        sessionId,
        count: entries.length,
      });

      await safeReply(
        interaction,
        "⚠️ Confirmation step started.\n\n" +
          "➡️ Now run:\n" +
          "`/q confirm target:<week/event>`\n\n" +
          "💡 Start typing in 'target' to see suggestions."
      );

      return;
    }

    // =============================
    // INVALID STAGE
    // =============================
    if (session.stage !== "CONFIRM_PENDING") {
      l.warn("confirm_blocked_stage", {
        sessionId,
        stage: session.stage,
      });

      await safeReply(interaction, "❌ Invalid session stage");
      return;
    }

    // =============================
    // STEP 2 → SUBMIT
    // =============================
    const target = interaction.options.getString("target");

    if (!target) {
      l.warn("confirm_blocked_missing_target", {
        sessionId,
      });

      await safeReply(
        interaction,
        "❌ Missing target.\n\n" +
          "➡️ Use:\n" +
          "`/q confirm target:<week/event>`\n\n" +
          "💡 Autocomplete is enabled."
      );
      return;
    }

    const mode = resolveMode(session.type);

    l.event("confirm_submit", {
      sessionId,
      mode,
      count: entries.length,
      target,
    });

    if (mode === "points") {
      await enqueuePoints(
        entries.map((e) => ({
          guildId,
          category: session.type,
          week: target,
          nickname: e.nickname,
          points: e.value,
        })),
        ctx.traceId
      );
    } else {
      await enqueueEvents(
        entries.map((e) => ({
          guildId,
          eventId: target,
          type: session.type,
          nickname: e.nickname,
        })),
        ctx.traceId
      );
    }

    l.event("confirm_cleanup", { sessionId });

    QuickAddBuffer.clear(sessionId, ctx.traceId);
    QuickAddSession.end(guildId, userId, ctx.traceId);

    await safeReply(
      interaction,
      `✅ Submitted ${entries.length} entries`
    );

    const duration = Date.now() - startedAt;

    l.event("confirm_done", {
      sessionId,
      mode,
      count: entries.length,
      durationMs: duration,
    });

  } catch (err) {
    const duration = Date.now() - startedAt;

    l.error("confirm_failed", {
      sessionId,
      durationMs: duration,
      error: err,
    });

    await safeReply(
      interaction,
      "❌ Failed to confirm entries"
    );
  }
}