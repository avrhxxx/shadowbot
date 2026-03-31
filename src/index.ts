// =====================================
// 📁 src/index.ts
// =====================================

import { Client, GatewayIntentBits, Partials } from "discord.js";

import { createLogger } from "@/foundation/logger";
import { createAppContext } from "@/trace";

import { loadAllSystems } from "@/runtime/runtimeLoader";
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
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

// =====================================
// 🔹 APP CONTEXT
// =====================================

const ctx = createAppContext();
const log = createLogger(ctx);

// =====================================
// 🔥 BOOTSTRAP LOGS
// =====================================

console.log("🔥 APP START");
log.info("app.init");

// =====================================
// 🧪 DEBUG (KLUCZOWE TERAZ)
// =====================================

client.on("debug", (msg) => {
  console.log("🐛 DEBUG:", msg);
});

client.on("error", (err) => {
  console.error("❌ CLIENT ERROR:", err);
});

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
// 🚀 READY (RAW EVENT)
// =====================================

client.once("ready", async () => {
  console.log("🟢 DISCORD READY (raw)");

  log.info("app.ready", {
    meta: { user: client.user?.tag },
  });

  // =============================
  // 🧠 INIT GOOGLE (SELF-HEALING)
  // =============================

  try {
    await ensureAllSheets();
    log.info("app.google.ready");
  } catch (err) {
    log.error("app.google.failed", err);
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

log.info("app.login.start");

client
  .login(BOT_TOKEN)
  .then(() => {
    log.info("app.login.success");
  })
  .catch((err) => {
    log.error("app.login.failed", err);
  });