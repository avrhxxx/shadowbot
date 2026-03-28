// =====================================
// 📁 src/system/quickadd/discord/actions/confirm/confirmAutocomplete.ts
// =====================================

import { AutocompleteInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddType } from "../../../core/QuickAddTypes";

import { logger } from "../../../../core/logger/log";

// =====================================
// MOCK DATA
// =====================================

const WEEK_OPTIONS = [
  { name: "Current Week", value: "CURRENT" },
  { name: "Last Week", value: "LAST" },
];

const EVENT_OPTIONS = [
  { name: "Reservoir Raid #1", value: "event_1" },
  { name: "Reservoir Raid #2", value: "event_2" },
];

// =====================================

function resolveMode(type: QuickAddType): "points" | "events" {
  if (type === "DONATIONS_POINTS" || type === "DUEL_POINTS") {
    return "points";
  }
  return "events";
}

// =====================================

export async function handleConfirmAutocomplete(
  interaction: AutocompleteInteraction,
  traceId: string
): Promise<void> {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!guildId) {
    logger.emit({
      scope: "quickadd.confirm_autocomplete",
      event: "confirm_autocomplete_no_guild",
      traceId,
      level: "warn",
      context: { userId },
    });

    try {
      await interaction.respond([]);
    } catch {}

    return;
  }

  try {
    const session = QuickAddSession.get(guildId, userId);

    if (!session || session.stage !== "CONFIRM_PENDING") {
      logger.emit({
        scope: "quickadd.confirm_autocomplete",
        event: "confirm_autocomplete_blocked",
        traceId,
        context: {
          sessionId: session?.sessionId,
          guildId,
          userId,
          hasSession: !!session,
          stage: session?.stage,
        },
        stats: {
          confirm_autocomplete_blocked: 1,
        },
      });

      await interaction.respond([]);
      return;
    }

    const focusedRaw = interaction.options.getFocused();
    const focused = String(focusedRaw ?? "").toLowerCase();

    const mode = resolveMode(session.type);

    const options =
      mode === "points" ? WEEK_OPTIONS : EVENT_OPTIONS;

    const filtered = options.filter((opt) =>
      opt.name.toLowerCase().includes(focused)
    );

    logger.emit({
      scope: "quickadd.confirm_autocomplete",
      event: "confirm_autocomplete",
      traceId,
      context: {
        sessionId: session.sessionId,
        guildId,
        userId,
        inputRaw: focusedRaw,
        input: focused,
        results: filtered.length,
        mode,
      },
      meta: {
        preview: filtered.slice(0, 3).map((o) => o.value),
      },
      stats: {
        confirm_autocomplete_used: 1,
      },
    });

    await interaction.respond(
      filtered.slice(0, 25).map((opt) => ({
        name: opt.name,
        value: opt.value,
      }))
    );

  } catch (err) {
    logger.emit({
      scope: "quickadd.confirm_autocomplete",
      event: "confirm_autocomplete_failed",
      traceId,
      level: "warn",
      context: {
        guildId,
        userId,
      },
      error: err,
    });

    try {
      await interaction.respond([]);
    } catch {}
  }
}