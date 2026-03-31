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
// 🔹 BOOTSTRAP
// =====================================

log.system("app").flow("bootstrap").start();

// =====================================
// 🔹 GLOBAL ERRORS
// =====================================

process.on("unhandledRejection", (err) => {
  log.system("app").flow("runtime").fail(err);
});

process.on("uncaughtException", (err) => {
  log.system("app").flow("runtime").fail(err);
  process.exit(1);
});

// =====================================
// 🚀 READY
// =====================================

client.once("ready", async () => {
  log.system("app")
    .flow("discord")
    .event("client.ready")
    .info({
      meta: { user: client.user?.tag },
    });

  // =============================
  // 🧠 INIT GOOGLE
  // =============================

  const googleFlow = log.system("app").flow("google.init");

  googleFlow.start();

  try {
    await ensureAllSheets();

    googleFlow.success();
  } catch (err) {
    googleFlow.fail(err);
    return;
  }

  // =============================
  // 🧠 RUNTIME START
  // =============================

  const runtimeFlow = log.system("app").flow("runtime");

  runtimeFlow.start();

  try {
    await loadAllSystems();

    runtimeFlow.success();
  } catch (err) {
    runtimeFlow.fail(err);
  }
});

// =====================================
// 🔐 LOGIN
// =====================================

const loginFlow = log.system("app").flow("discord.login");

loginFlow.start();

client
  .login(BOT_TOKEN)
  .then(() => {
    loginFlow.success();
  })
  .catch((err) => {
    loginFlow.fail(err);
  });