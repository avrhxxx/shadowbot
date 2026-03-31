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
// 🔹 BOOTSTRAP (APP)
// =====================================

const bootstrapFlow = log.system("app").flow("bootstrap");
bootstrapFlow.start();

// =====================================
// 🔹 GLOBAL ERRORS (APP)
// =====================================

const globalRuntimeFlow = log.system("app").flow("runtime");

process.on("unhandledRejection", (err) => {
  globalRuntimeFlow.fail(err);
});

process.on("uncaughtException", (err) => {
  globalRuntimeFlow.fail(err);
  process.exit(1);
});

// =====================================
// 🚀 READY
// =====================================

client.once("ready", async () => {
  // 🔹 DISCORD READY (SYSTEM: discord)
  const discordFlow = log.system("discord").flow("lifecycle");

  discordFlow.stepInfo("client.ready", {
    meta: { user: client.user?.tag },
  });

  // =============================
  // 🧠 INIT GOOGLE
  // =============================

  const googleFlow = log.system("google").flow("init");

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

  const runtimeFlow = log.system("runtime").flow("bootstrap");

  runtimeFlow.start();

  try {
    await loadAllSystems();
    runtimeFlow.success();
  } catch (err) {
    runtimeFlow.fail(err);
  }
});

// =====================================
// 🔐 LOGIN (DISCORD)
// =====================================

const loginFlow = log.system("discord").flow("login");

loginFlow.start();

client
  .login(BOT_TOKEN)
  .then(() => {
    loginFlow.success();
  })
  .catch((err) => {
    loginFlow.fail(err);
  });