// =====================================
// 📁 src/index.ts
// =====================================

import {
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";

import { createLogger } from "@/foundation/logger";
import {
  createAppContext,
  createRootContext,
} from "@/trace";

import { loadAllSystems } from "@/runtime/runtimeLoader";
import { ensureAllSheets } from "@/integrations/google";

import { handleUIInteraction } from "@/ui/core/uiDiscordAdapter";

// 🔥 DEV PANEL
import { handleDevpanelCommand } from "@/systems/devpanel/commands/devpanel.command";
import { devpanelSlash } from "@/systems/devpanel/commands/devpanel.slash";

// 🔹 MODERATOR
import { handleModeratorCommand } from "@/systems/moderator/commands/moderator.command";
import { moderatorSlash } from "@/systems/moderator/commands/moderator.slash";

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

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
  ],
});

// =====================================
// 🔹 APP CONTEXT
// =====================================

const appCtx = createAppContext();
const appLog = createLogger(appCtx);

// =====================================
// 🔹 BOOTSTRAP
// =====================================

const bootstrapFlow = appLog.flow("bootstrap");
bootstrapFlow.start();

// =====================================
// 🔹 GLOBAL ERRORS
// =====================================

const runtimeFlow = appLog.flow("runtime");

process.on("unhandledRejection", (err) => {
  runtimeFlow.fail(err);
});

process.on("uncaughtException", (err) => {
  runtimeFlow.fail(err);
  process.exit(1);
});

// =====================================
// 🖱️ INTERACTIONS
// =====================================

client.on("interactionCreate", async (interaction) => {
  const ctx = createRootContext({
    source: "discord",
  });

  // =============================
  // 🔘 UI (BUTTONS)
  // =============================

  const handled = await handleUIInteraction(interaction, ctx);
  if (handled) return;

  // =============================
  // 💬 SLASH COMMANDS
  // =============================

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "devpanel") {
      await handleDevpanelCommand(interaction);
      return;
    }

    if (interaction.commandName === "moderator") {
      await handleModeratorCommand(interaction);
      return;
    }
  }
});

// =====================================
// 🚀 READY
// =====================================

client.once("ready", async () => {
  const discordFlow = appLog.flow("discord");

  discordFlow.stepInfo("ready", {
    meta: { user: client.user?.tag },
  });

  // =============================
  // 🧠 REGISTER COMMANDS (DEV + MODERATOR)
  // =============================

  const commandsFlow = appLog.flow("commands");
  commandsFlow.start();

  try {
    await client.application?.commands.set([
      devpanelSlash.toJSON(),
      moderatorSlash.toJSON(),
    ]);

    commandsFlow.success();
  } catch (err) {
    commandsFlow.fail(err);
  }

  // =============================
  // 🧠 GOOGLE INIT
  // =============================

  const googleCtx = createRootContext({
    source: "system",
    system: "google",
  });

  const googleLog = createLogger(googleCtx);
  const googleFlow = googleLog.flow("init");

  googleFlow.start();

  try {
    await ensureAllSheets();
    googleFlow.success();
  } catch (err) {
    googleFlow.fail(err);
    return;
  }

  // =============================
  // 🧠 RUNTIME
  // =================================

  const runtimeCtx = createRootContext({
    source: "system",
    system: "runtime",
  });

  const runtimeLog = createLogger(runtimeCtx);
  const runtimeLoadFlow = runtimeLog.flow("load");

  runtimeLoadFlow.start();

  try {
    await loadAllSystems();
    runtimeLoadFlow.success();
  } catch (err) {
    runtimeLoadFlow.fail(err);
  }
});

// =====================================
// 🔐 LOGIN
// =====================================

const loginFlow = appLog.flow("login");

loginFlow.start();

client
  .login(BOT_TOKEN)
  .then(() => {
    loginFlow.success();
  })
  .catch((err) => {
    loginFlow.fail(err);
  });