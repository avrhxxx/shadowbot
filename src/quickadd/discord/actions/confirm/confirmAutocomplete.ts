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

// TODO: replace with real config layer
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
  interaction: AutocompleteInteraction
): Promise<void> {
  const guildId = interaction.guildId;

  if (!guildId) return;

  const session = QuickAddSession.get(guildId);

  if (!session) return;

  const focused = interaction.options.getFocused();

  const mode = resolveMode(session.type);

  let options =
    mode === "points" ? WEEK_OPTIONS : EVENT_OPTIONS;

  // 🔍 filtering
  const filtered = options.filter((opt) =>
    opt.name.toLowerCase().includes(focused.toLowerCase())
  );

  log.trace("confirm_autocomplete", "NO_TRACE", {
    guildId,
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