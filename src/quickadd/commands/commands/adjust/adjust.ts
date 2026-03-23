// =====================================
// 📁 src/quickadd/commands/commands/adjust/adjust.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("COMMAND");

type AdjustField = "nickname" | "value";

export async function adjustCommand(
  interaction: ChatInputCommandInteraction
) {
  const guildId = interaction.guild!.id;

  const id = interaction.options.getInteger("id", true);
  const field = interaction.options.getString("field", true) as AdjustField;
  const newValue = interaction.options.getString("value", true);

  log("adjust_attempt", {
    id,
    field,
    value: newValue,
  });

  const data = QuickAddBuffer.getEntries(guildId);
  const entry = data.find(e => e.id === id); // 🔥 FIX

  if (!entry) {
    log.warn("adjust_invalid_id", id);

    return interaction.editReply({
      content: "❌ Invalid line ID",
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

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}