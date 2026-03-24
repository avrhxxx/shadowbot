// =====================================
// 📁 src/quickadd/commands/confirm/confirm.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { formatPreview } from "../../../utils/formatPreview";
import { createLogger } from "../../../debug/DebugLogger";

import {
  enqueuePoints,
  enqueueEvents,
} from "../../../storage/QuickAddService";

import { readSheet } from "../../../../google/googleSheetsStorage";

const log = createLogger("COMMAND");

// =====================================
// 📌 CONFIG
// =====================================
const EVENTS_TAB = "events";
const POINTS_WEEKS_TAB = "points_weeks";

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
      content: "❌ Only session owner can confirm",
    });
  }

  const entries = QuickAddBuffer.getEntries(guildId);

  if (!entries.length) {
    return interaction.editReply({
      content: "⚠️ No data to confirm",
    });
  }

  // =====================================
  // 🔥 HARD GATE
  // =====================================
  const invalidEntries = entries.filter(
    (e: any) => e.status !== "OK"
  );

  // =============================
  // 🧠 STAGE 1
  // =============================
  if (session.stage === "COLLECTING") {
    if (invalidEntries.length > 0) {
      const preview = formatPreview(entries);

      return interaction.editReply({
        content:
`❌ **All entries must be valid (status ✅ OK)**

${preview}

👉 Fix using:
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
        content:
`❌ Still invalid entries present

Fix all issues before confirming.`,
      });
    }

    try {
      // =====================================
      // 🔥 EVENTS FLOW
      // =====================================
      if (session.type.startsWith("RR_")) {
        const events = await readSheet(EVENTS_TAB);
        const headers = events[0];

        const idxId = headers.indexOf("eventId");
        const idxType = headers.indexOf("eventType");

        const matching = events
          .slice(1)
          .filter((row: any[]) => row[idxType] === session.type);

        if (!matching.length) {
          return interaction.editReply({
            content: "❌ No matching event found",
          });
        }

        // 🔥 NAJNOWSZY EVENT (last row)
        const selected = matching[matching.length - 1];
        const eventId = selected[idxId];

        await enqueueEvents(
          entries.map((e: any) => ({
            guildId,
            eventId,
            type: session.type,
            nickname: e.nickname,
          }))
        );

        log("events_enqueued", {
          eventId,
          count: entries.length,
        });
      }

      // =====================================
      // 🔥 POINTS FLOW
      // =====================================
      else {
        const weeks = await readSheet(POINTS_WEEKS_TAB);
        const headers = weeks[0];

        const idxWeek = headers.indexOf("week");

        if (idxWeek === -1) {
          return interaction.editReply({
            content: "❌ Invalid weeks config",
          });
        }

        const lastRow = weeks[weeks.length - 1];
        const week = lastRow[idxWeek];

        await enqueuePoints(
          entries.map((e: any) => ({
            guildId,
            category: session.type,
            week,
            nickname: e.nickname,
            points: e.value,
          }))
        );

        log("points_enqueued", {
          week,
          count: entries.length,
        });
      }

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

  return interaction.editReply({
    content: "❌ Invalid session state",
  });
}