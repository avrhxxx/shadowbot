// =====================================
// 📁 src/index.ts
// =====================================

import { Client, GatewayIntentBits, Partials } from "discord.js";

import { createLogger } from "@/foundation/logger";
import { createAppContext } from "@/trace";
import { createFlowLogger } from "@/foundation/logger/helpers/flowLogger";

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

const bootstrapFlow = createFlowLogger(log, "app.bootstrap");
bootstrapFlow.start();

// =====================================
// 🔹 GLOBAL ERRORS (APP)
// =====================================

const globalRuntimeFlow = createFlowLogger(log, "app.runtime");

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
  const discordFlow = createFlowLogger(log, "app.discord");

  discordFlow.stepInfo("client.ready", {
    meta: { user: client.user?.tag },
  });

  // =============================
  // 🧠 INIT GOOGLE
  // =============================

  const googleFlow = createFlowLogger(log, "app.google.init");

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

  const runtimeFlow = createFlowLogger(log, "app.runtime");

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

const loginFlow = createFlowLogger(log, "app.discord.login");

loginFlow.start();

client
  .login(BOT_TOKEN)
  .then(() => {
    loginFlow.success();
  })
  .catch((err) => {
    loginFlow.fail(err);
  });