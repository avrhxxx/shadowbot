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
import { buildLayout } from "../parsing/layout/LayoutParser";
import { resolveNickname } from "../mapping/NicknameResolver";
import { saveLearning } from "../storage/QuickAddService";

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
// 🔥 SCORING SYSTEM
// =====================================

function scoreParsed(entries: any[]): number {
  if (!entries.length) return 0;

  let score = 0;

  for (const e of entries) {
    if (e.value > 0) score += 2;
    if (e.nickname && e.nickname.length >= 4) score += 1;
    if (/[a-zA-Z]/.test(e.nickname)) score += 1;
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
    let bestLayout: any[] = [];
    let bestSource = "none";
    let bestScore = -Infinity;

    for (const source of ocrResult.sources) {
      try {
        let parsed: any[] = [];
        let layout: any[] = [];

        // =====================================
        // 🔥 TOKENS → LAYOUT → PARSER
        // =====================================
        if ("tokens" in source && source.tokens?.length > 0) {
          log("parse_attempt", {
            source: source.source,
            tokens: source.tokens.length,
            traceId,
          });

          layout = buildLayout(source.tokens, traceId);

          parsed = parseByType(
            session.type,
            { layout },
            traceId
          );
        }

        // =====================================
        // 🔹 FALLBACK (LINES)
        // =====================================
        else if ("lines" in source && source.lines?.length > 0) {
          log("parse_attempt", {
            source: source.source,
            lines: source.lines.length,
            traceId,
          });

          parsed = parseByType(
            session.type,
            { lines: source.lines },
            traceId
          );
        }

        const score = scoreParsed(parsed);
        const quality = analyzeQuality(parsed);

        log("parse_result", {
          source: source.source,
          parsed: parsed.length,
          score,
          ...quality,
          traceId,
        });

        if (score > bestScore) {
          bestParsed = parsed;
          bestLayout = layout;
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

    // =====================================
    // 🔥 LEARNING (WITH MATCHING)
    // =====================================
    try {
      const learningRows = bestLayout.map((row: any) => {
        const raw = row.raw.map((t: any) => t.text).join(" ");

        const layoutText = [
          ...row.left.map((t: any) => t.text),
          ...row.right.map((t: any) => t.text),
        ].join(" ");

        const matched = findBestMatch(layoutText, bestParsed);

        return {
          type: session.type,
          ocr_raw: raw,
          layout_text: layoutText,
          parser_output: matched || "",
        };
      });

      await saveLearning(learningRows);
    } catch (err) {
      log.warn("learning_save_failed", err);
    }

    // =====================================
    // 🔥 MAPPING
    // =====================================
    let mapped: any[] = [];

    try {
      mapped = await Promise.all(
        bestParsed.map(async (e) => ({
          ...e,
          nickname: await resolveNickname(e.nickname),
        }))
      );
    } catch (err) {
      log.warn("mapping_failed", err);
      mapped = bestParsed;
    }

    // =====================================
    // 🔥 VALIDATION
    // =====================================
    let validated = [];

    try {
      validated = await validateEntries(mapped);

      log("validation_done", {
        count: validated.length,
        traceId,
      });
    } catch (err) {
      log.warn("validation_failed_fallback_to_parsed", err);

      validated = mapped.map((e) => ({
        ...e,
      }));
    }

    // =====================================
    // 🔥 BUFFER
    // =====================================
    QuickAddBuffer.addEntries(guildId, validated as any);

    // =====================================
    // 🔥 PREVIEW
    // =====================================
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

// =====================================
// 🔍 MATCHING
// =====================================
function findBestMatch(layoutText: string, parsed: any[]): string {
  const cleanLayout = clean(layoutText);

  let best: string | null = null;

  for (const p of parsed) {
    const cleanParsed = clean(p.nickname);

    if (!cleanParsed) continue;

    if (cleanLayout === cleanParsed) {
      return p.nickname;
    }

    if (cleanLayout.includes(cleanParsed)) {
      best = p.nickname;
    }
  }

  return best;
}

function clean(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}