// =====================================
// 📁 src/system/quickadd/discord/actions/confirm/confirmAutocomplete.ts
// =====================================

import { AutocompleteInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddType } from "../../../core/QuickAddTypes";

import { log } from "../../../../core/logger/log";
import { TraceContext } from "../../../../core/trace/TraceContext";

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
  ctx: TraceContext
): Promise<void> {
  const l = log.ctx(ctx);

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!guildId) {
    l.warn("confirm_autocomplete_no_guild", {
      userId,
    });

    try {
      await interaction.respond([]);
    } catch {}

    return;
  }

  try {
    const session = QuickAddSession.get(guildId, userId);

    if (!session || session.stage !== "CONFIRM_PENDING") {
      l.event("confirm_autocomplete_blocked", {
        sessionId: session?.sessionId,
        guildId,
        userId,
        hasSession: !!session,
        stage: session?.stage,
        reason: !session ? "no_session" : "invalid_stage",
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

    l.event("confirm_autocomplete", {
      sessionId: session.sessionId,
      guildId,
      userId,
      inputRaw: focusedRaw,
      input: focused,
      results: filtered.length,
      mode,
    });

    await interaction.respond(
      filtered.slice(0, 25).map((opt) => ({
        name: opt.name,
        value: opt.value,
      }))
    );

  } catch (err) {
    l.warn("confirm_autocomplete_failed", {
      guildId,
      userId,
      error: err,
    });

    try {
      await interaction.respond([]);
    } catch {}
  }
}