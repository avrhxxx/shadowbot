// =====================================
// 📁 src/quickadd/commands/commands/preview/preview.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { createLogger } from "../../../debug/DebugLogger";
import { formatPreview } from "../../../utils/formatPreview";
import { validateQuickAddContext } from "../../../rules/quickAddRules";

const log = createLogger("COMMAND");

export async function previewCommand(
  interaction: ChatInputCommandInteraction
) {
  const guildId = interaction.guild!.id;

  const session = QuickAddSession.get(guildId);

  // 🔥 CENTRAL VALIDATION (session + context)
  const error = validateQuickAddContext(interaction, session);
  if (error) {
    log.warn("preview_blocked", error);
    return interaction.editReply({ content: error });
  }

  const data = QuickAddBuffer.getEntries(guildId);

  log("preview_fetch", {
    count: data.length,
  });

  if (!data.length) {
    log.warn("preview_empty");

    return interaction.editReply({
      content: "⚠️ No parsed data yet",
    });
  }

  const formatted = formatPreview(data);

  log("preview_render", {
    lines: data.length,
  });

  log("preview_output", {
    lines: data.length,
    content: formatted,
  });

  return interaction.editReply({
    content: formatted,
  });
}