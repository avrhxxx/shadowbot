// =====================================
// 📁 src/quickadd/commands/commands/adjust/adjust.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { createLogger } from "../../../debug/DebugLogger";
import { isQuickAddContext } from "../../../rules/isQuickAddContext";

const log = createLogger("COMMAND");

type AdjustField = "nickname" | "value";

export async function adjustCommand(
  interaction: ChatInputCommandInteraction
) {
  const guildId = interaction.guild!.id;

  const session = QuickAddSession.get(guildId);

  if (!session) {
    log.warn("adjust_no_session");

    return interaction.editReply({
      content: "❌ No active session",
    });
  }

  // 🔥 CONTEXT CHECK (channel OR thread)
  if (!isQuickAddContext(interaction.channel, session)) {
    log.warn("adjust_wrong_context", {
      channel: interaction.channelId,
    });

    return interaction.editReply({
      content: "❌ Use this command inside QuickAdd session (thread)",
    });
  }

  const id = interaction.options.getInteger("id", true);
  const field = interaction.options.getString("field", true) as AdjustField;
  const newValue = interaction.options.getString("value", true);

  log("adjust_attempt", {
    id,
    field,
    value: newValue,
  });

  const data = QuickAddBuffer.getEntries(guildId);
  const entry = data.find(e => e.id === id);

  if (!entry) {
    log.warn("adjust_invalid_id", id);

    return interaction.editReply({
      content: "❌ Invalid entry ID",
    });
  }

  let oldValueDisplay = "";
  let newValueDisplay = "";

  switch (field) {
    case "nickname":
      oldValueDisplay = entry.nickname;
      entry.nickname = newValue;
      newValueDisplay = entry.nickname;

      log("adjust_nickname", {
        id,
        value: newValue,
      });
      break;

    case "value":
      const parsed = Number(newValue);

      if (isNaN(parsed)) {
        log.warn("adjust_invalid_value", newValue);

        return interaction.editReply({
          content: "❌ Value must be a number",
        });
      }

      oldValueDisplay = formatNumber(entry.value);
      entry.value = parsed;
      newValueDisplay = formatNumber(entry.value);

      log("adjust_value", {
        id,
        value: parsed,
      });
      break;

    default:
      log.warn("adjust_unknown_field", field);

      return interaction.editReply({
        content: "❌ Unknown field",
      });
  }

  return interaction.editReply({
    content: `
✅ Entry updated

[${id}] ${entry.nickname}

${oldValueDisplay} → ${newValueDisplay}
`.trim(),
  });
}

// =====================================
// 🔢 NUMBER FORMATTER
// =====================================
function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}