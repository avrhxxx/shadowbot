// =====================================
// 📁 src/index.ts
// =====================================

/**
 * 🧠 ROLE:
 * Application entrypoint (minimal bootstrap)
 *
 * Responsibilities:
 * - initialize integrations
 * - start runtime systems
 * - setup Discord client
 *
 * ❗ RULES:
 * - NO business logic
 * - NO system logic
 */

// =====================================
// 🔹 BOOTSTRAP (SIDE EFFECTS)
// =====================================

import "./integrations/google/googleSheetsClient.js";

// =====================================
// 🔹 LIBS
// =====================================

import { Client, GatewayIntentBits, Partials } from "discord.js";

// =====================================
// 🔹 FOUNDATION
// =====================================

import { createLogger } from "@/foundation/logger";
import { createAppContext } from "@/trace";

// =====================================
// 🔹 RUNTIME
// =====================================

import { loadAllSystems } from "@/runtime/runtimeLoader";

// =====================================
// 🔹 INTEGRATIONS
// =====================================

import { ensureAllSheets } from "@/integrations/google";

// =====================================
// 🔐 ENV
// =====================================

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN not defined");
}

// =====================================
// 🔹 CLIENT
// =====================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
  partials: [Partials.Channel],
});

// =====================================
// 🔹 APP CONTEXT
// =====================================

const ctx = createAppContext();
const log = createLogger(ctx);

// =====================================
// 🔹 GLOBAL ERRORS
// =====================================

process.on("unhandledRejection", (err) => {
  log.error("app.unhandled_rejection", err);
});

process.on("uncaughtException", (err) => {
  log.fatal("app.uncaught_exception", err);
  process.exit(1);
});

// =====================================
// 🚀 READY
// =====================================

client.once("clientReady", async () => {
  log.info("app.ready", {
    meta: { user: client.user?.tag },
  });

  // =============================
  // 🧠 INIT SHEETS
  // =============================

  try {
    await ensureAllSheets();
    log.info("app.sheets.ready");
  } catch (err) {
    log.error("app.sheets.failed", err);
    return;
  }

  // =============================
  // 🧠 RUNTIME START
  // =============================

  try {
    log.info("runtime.start");

    await loadAllSystems();

    log.info("runtime.ready");
  } catch (err) {
    log.error("runtime.failed", err);
  }
});

// =====================================
// 🔐 LOGIN
// =====================================

client.login(BOT_TOKEN);