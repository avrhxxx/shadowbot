// =====================================
// 📁 src/quickadd/discord/actions/confirm/confirmAutocomplete.ts
// =====================================

import { AutocompleteInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddType } from "../../../core/QuickAddTypes";

import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🧠 MOCK CONFIG (TEMP)
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
// 🧠 MODE RESOLVER
// =====================================

function resolveMode(type: QuickAddType): "points" | "events" {
  if (type === "DONATIONS_POINTS" || type === "DUEL_POINTS") {
    return "points";
  }

  return "events";
}

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleConfirmAutocomplete(
  interaction: AutocompleteInteraction,
  traceId: string
): Promise<void> {
  const guildId = interaction.guildId;

  if (!guildId) return;

  const session = QuickAddSession.get(guildId);

  // =====================================
  // ❌ NO SESSION
  // =====================================

  if (!session) {
    await interaction.respond([]);
    return;
  }

  // =====================================
  // ❌ WRONG STAGE
  // =====================================

  if (session.stage !== "CONFIRM_PENDING") {
    await interaction.respond([]);
    return;
  }

  const focused = interaction.options.getFocused();

  const mode = resolveMode(session.type);

  const options =
    mode === "points" ? WEEK_OPTIONS : EVENT_OPTIONS;

  // =====================================
  // 🔍 FILTERING
  // =====================================

  const filtered = options.filter((opt) =>
    opt.name.toLowerCase().includes(focused.toLowerCase())
  );

  log.trace("confirm_autocomplete", traceId, {
    guildId,
    sessionId: session.sessionId,
    mode,
    input: focused,
    results: filtered.length,
  });

  await interaction.respond(
    filtered.slice(0, 25).map((opt) => ({
      name: opt.name,
      value: opt.value,
    }))
  );
}