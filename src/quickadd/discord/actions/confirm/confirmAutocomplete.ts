// =====================================
// 📁 src/quickadd/discord/actions/confirm/confirmAutocomplete.ts
// =====================================

/**
 * 🧠 ROLE:
 * Provides autocomplete suggestions for confirm target.
 *
 * ❗ RULES:
 * - requires active session
 * - stage must be CONFIRM_PENDING
 * - traceId injected
 *
 * ✅ FINAL:
 * - log.emit only
 * - lightweight observability
 */

import { AutocompleteInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddType } from "../../../core/QuickAddTypes";

import { log, metrics } from "../../../logger";

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

  if (!guildId) return;

  const session = QuickAddSession.get(guildId, userId);

  // 🔒 brak sesji lub zły stage → brak sugestii
  if (!session || session.stage !== "CONFIRM_PENDING") {
    await interaction.respond([]);
    return;
  }

  const focused = interaction.options.getFocused();

  const mode = resolveMode(session.type);

  const options =
    mode === "points" ? WEEK_OPTIONS : EVENT_OPTIONS;

  const filtered = options.filter((opt) =>
    opt.name.toLowerCase().includes(focused.toLowerCase())
  );

  metrics.increment("confirm_autocomplete_used");

  log.emit({
    event: "confirm_autocomplete",
    traceId,
    data: {
      sessionId: session.sessionId,
      input: focused,
      results: filtered.length,
    },
  });

  await interaction.respond(
    filtered.slice(0, 25).map((opt) => ({
      name: opt.name,
      value: opt.value,
    }))
  );
}