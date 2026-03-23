// =====================================
// 📁 src/quickadd/commands/commands/adjust/adjust.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { createLogger } from "../../../debug/DebugLogger";
import { validateQuickAddContext } from "../../../rules/quickAddRules";

// 🔥 resolver
import { resolveNickname } from "../../../mapping/NicknameResolver";

// 🔥 zapis adjusted (TYLKO NICK)
import { appendQuickAddAdjusted } from "../../../../googleSheetsStorage";

const log = createLogger("COMMAND");

type AdjustField = "nickname" | "value";

export async function adjustCommand(
  interaction: ChatInputCommandInteraction
) {
  const guildId = interaction.guild!.id;

  const session = QuickAddSession.get(guildId);

  // 🔥 CENTRAL VALIDATION
  const error = validateQuickAddContext(interaction, session);
  if (error) {
    log.warn("adjust_blocked", error);
    return interaction.editReply({ content: error });
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

      // 🔥 RESOLVE
      const resolved = await resolveNickname(newValue);

      entry.nickname = resolved;
      newValueDisplay = entry.nickname;

      log("adjust_nickname", {
        id,
        input: newValue,
        resolved,
      });

      // =====================================
      // 🔥 SAVE ONLY NICKNAME (LEARNING)
      // =====================================
      try {
        if (session?.type) {
          await appendQuickAddAdjusted([
            {
              type: session.type,
              nickname: resolved,
            },
          ]);
        }
      } catch (err) {
        log.warn("adjust_save_failed", err);
      }

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