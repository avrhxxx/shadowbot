// =====================================
// 📁 src/quickadd/commands/commands/confirm/confirm.ts
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

  const mode = interaction.options.getString("mode", true);
  const manualEventId = interaction.options.getString("eventid");
  const manualWeek = interaction.options.getString("week");

  log("confirm_attempt", {
    guildId,
    userId,
    channelId,
    mode,
    manualEventId,
    manualWeek,
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

  const invalidEntries = entries.filter(
    (e: any) => e.status !== "OK"
  );

  // =============================
  // STAGE 1
  // =============================
  if (session.stage === "COLLECTING") {
    if (invalidEntries.length > 0) {
      const preview = formatPreview(entries);

      return interaction.editReply({
        content:
`❌ All entries must be valid

${preview}`,
      });
    }

    const preview = formatPreview(entries);

    session.stage = "CONFIRM_PENDING";

    return interaction.editReply({
      content:
`⚠️ CONFIRM AGAIN TO FINALIZE

${preview}`,
    });
  }

  // =============================
  // STAGE 2
  // =============================
  if (session.stage === "CONFIRM_PENDING") {
    try {
      // =====================================
      // EVENTS
      // =====================================
      if (session.type.startsWith("RR_")) {
        let eventId = manualEventId;

        if (mode === "auto") {
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

          const selected = matching[matching.length - 1];
          eventId = selected[idxId];
        }

        if (!eventId) {
          return interaction.editReply({
            content: "❌ Missing eventId",
          });
        }

        await enqueueEvents(
          entries.map((e: any) => ({
            guildId,
            eventId,
            type: session.type,
            nickname: e.nickname,
          }))
        );
      }

      // =====================================
      // POINTS
      // =====================================
      else {
        let week = manualWeek;

        if (mode === "auto") {
          const weeks = await readSheet(POINTS_WEEKS_TAB);
          const headers = weeks[0];

          const idxWeek = headers.indexOf("week");

          const lastRow = weeks[weeks.length - 1];
          week = lastRow[idxWeek];
        }

        if (!week) {
          return interaction.editReply({
            content: "❌ Missing week",
          });
        }

        await enqueuePoints(
          entries.map((e: any) => ({
            guildId,
            category: session.type,
            week,
            nickname: e.nickname,
            points: e.value,
          }))
        );
      }

    } catch (err) {
      log.error("queue_failed", err);

      return interaction.editReply({
        content: "❌ Failed to enqueue data",
      });
    }

    session.stage = "COLLECTING";

    return interaction.editReply({
      content: "✅ Data sent",
    });
  }

  return interaction.editReply({
    content: "❌ Invalid session state",
  });
}