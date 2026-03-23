// =====================================
// 📁 src/quickadd/commands/commands/preview/preview.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { createLogger } from "../../../debug/DebugLogger";
import { formatPreview } from "../../../utils/formatPreview"; // 🔥 NEW

const log = createLogger("COMMAND");

export async function previewCommand(
  interaction: ChatInputCommandInteraction
) {
  const guildId = interaction.guild!.id;

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

  const formatted = formatPreview(data); // 🔥 CLEAN

  log("preview_render", {
    lines: data.length,
  });

  // 🔥 NEW — pełny output preview do logów
  log("preview_output", {
    lines: data.length,
    content: formatted,
  });

  return interaction.editReply({
    content: `📊 Preview:\n\n\`\`\`\n${formatted}\n\`\`\``,
  });
}