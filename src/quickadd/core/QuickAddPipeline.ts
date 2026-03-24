// =====================================
// 📁 src/quickadd/core/QuickAddPipeline.ts
// =====================================

import { Message } from "discord.js";
import { createLogger } from "../debug/DebugLogger";
import { runOCR } from "../ocr/OCRService";
import { parseByType } from "../parsing";
import { QuickAddBuffer } from "../storage/QuickAddBuffer";
import { formatPreview } from "../utils/formatPreview";
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

// =====================================
// 🔥 SCORING SYSTEM (NEW)
// =====================================

function scoreParsed(entries: any[]): number {
  if (!entries.length) return 0;

  let score = 0;

  for (const e of entries) {
    // valid value
    if (e.value > 0) score += 2;

    // nickname length
    if (e.nickname && e.nickname.length >= 4) score += 1;

    // contains letters
    if (/[a-zA-Z]/.test(e.nickname)) score += 1;

    // penalize garbage
    if (/[^a-zA-Z0-9\s]/.test(e.nickname)) score -= 0.5;
  }

  return score;
}

function analyzeQuality(entries: any[]) {
  if (!entries.length) {
    return {
      avgNameLength: 0,
      invalidValues: 0,
    };
  }

  return {
    avgNameLength:
      entries.reduce((a, e) => a + (e.nickname?.length || 0), 0) / entries.length,
    invalidValues: entries.filter((e) => !e.value || e.value <= 0).length,
  };
}

// =====================================
// 🚀 MAIN PIPELINE
// =====================================

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

    let bestParsed: any[] = [];
    let bestSource = "none";
    let bestScore = -Infinity;

    for (const source of ocrResult.sources) {
      try {
        let parsed: any[] = [];

        // =====================================
        // 🔹 TYPE SAFE INPUT
        // =====================================
        if ("lines" in source) {
          log("parse_attempt", {
            source: source.source,
            lines: source.lines.length,
            traceId,
          });

          parsed = parseByType(session.type, { lines: source.lines }, traceId);
        }

        if ("tokens" in source) {
          log("parse_attempt", {
            source: source.source,
            tokens: source.tokens.length,
            traceId,
          });

          parsed = parseByType(session.type, { tokens: source.tokens }, traceId);
        }

        // =====================================
        // 🔥 QUALITY ANALYSIS
        // =====================================
        const score = scoreParsed(parsed);
        const quality = analyzeQuality(parsed);

        log("parse_result", {
          source: source.source,
          parsed: parsed.length,
          score,
          ...quality,
          traceId,
        });

        // =====================================
        // 🔥 BEST SELECTION (FIXED)
        // =====================================
        if (score > bestScore) {
          bestParsed = parsed;
          bestSource = source.source;
          bestScore = score;
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
      score: bestScore,
      traceId,
    });

    const parsed = bestParsed;

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