// =====================================
// 📁 src/quickadd/core/QuickAddPipeline.ts
// =====================================

import { Message } from "discord.js";
import { createLogger } from "../debug/DebugLogger";
import { runOCR } from "../ocr/OCRService";
import { parseByType } from "../parsing";
import { QuickAddBuffer } from "../storage/QuickAddBuffer";
import { formatPreview } from "../utils/formatPreview";

// 🔥 NEW
import { validateEntries } from "../validation/QuickAddValidator";

const log = createLogger("PIPELINE");

const previewMessages = new Map<string, string>();

async function setStatusReaction(message: Message, emoji: string, traceId?: string) {
  try {
    await message.reactions.removeAll();
    await message.react(emoji);
  } catch (err) {
    log.warn("reaction_set_failed", { emoji, err });
  }
}

export async function processImageInput(
  message: Message,
  session: any,
  imageUrl: string,
  traceId: string
) {
  const guildId = message.guild!.id;

  await setStatusReaction(message, "📥", traceId);

  try {
    await setStatusReaction(message, "⏳", traceId);

    const ocrResult = await runOCR(imageUrl, traceId);

    // =====================================
    // 🔥 MULTI SOURCE PARSING
    // =====================================
    let bestParsed: any[] = [];
    let bestSource = "none";

    for (const source of ocrResult.sources) {
      try {
        log("parse_attempt", {
          source: source.source,
          lines: "lines" in source ? source.lines.length : undefined,
          tokens: "tokens" in source ? source.tokens.length : undefined,
          traceId,
        });

        let parsed: any[] = [];

        // 🔹 STANDARD (LINES)
        if ("lines" in source) {
          parsed = parseByType(session.type, source.lines, traceId);
        }

        // 🔥 NEW — LAYOUT (TOKENS)
        if ("tokens" in source) {
          if (session.type === "DONATIONS_POINTS") {
            const { parseDonationsFromLayout } = await import(
              "../parsing/donations/DonationsParser"
            );

            parsed = parseDonationsFromLayout(source.tokens, traceId);
          }
        }

        log("parse_result", {
          source: source.source,
          parsed: parsed.length,
          traceId,
        });

        if (parsed.length > bestParsed.length) {
          bestParsed = parsed;
          bestSource = source.source;
        }
      } catch (err) {
        log.warn("parse_failed_for_source", {
          source: source.source,
          err,
        });
      }
    }

    log("parse_best_selected", {
      source: bestSource,
      count: bestParsed.length,
      traceId,
    });

    const parsed = bestParsed;

    // =====================================
    // 🔥 VALIDATION LAYER
    // =====================================
    let validated = [];

    try {
      validated = await validateEntries(parsed);

      log("validation_done", {
        count: validated.length,
        traceId,
      });
    } catch (err) {
      log.warn("validation_failed_fallback_to_parsed", err);

      validated = parsed.map((e) => ({
        ...e,
      }));
    }

    // =====================================
    // 🔥 BUFFER
    // =====================================
    QuickAddBuffer.addEntries(guildId, validated as any);

    if (message.channel && "send" in message.channel) {
      const allData = QuickAddBuffer.getEntries(guildId);
      const content = formatPreview(allData);

      const existingId = previewMessages.get(guildId);

      try {
        if (existingId) {
          const existingMsg = await message.channel.messages
            .fetch(existingId)
            .catch(() => null);

          if (existingMsg) {
            await existingMsg.edit({ content });
          } else {
            const sent = await message.channel.send({ content });
            previewMessages.set(guildId, sent.id);
          }
        } else {
          const sent = await message.channel.send({ content });
          previewMessages.set(guildId, sent.id);
        }
      } catch (err) {
        log.warn("preview_failed", err);
      }
    }

    await setStatusReaction(message, "✅", traceId);

  } catch (err) {
    log.error("pipeline_error", err, traceId);
    await setStatusReaction(message, "❌", traceId);
  }
}