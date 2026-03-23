// =====================================
// 📁 src/quickadd/commands/commands/adjust/adjust.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { createLogger } from "../../../debug/DebugLogger";
import { validateQuickAddContext } from "../../../rules/quickAddRules";

// 🔥 NEW — resolver
import { resolveNickname } from "../../../mapping/NicknameResolver";

// 🔥 NEW — zapis do sheet
import { appendQuickAddRows } from "../../../../googleSheetsStorage";

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
      // 🔥 SAVE ONLY NICKNAME
      // =====================================
      try {
        await appendQuickAddRows([
         