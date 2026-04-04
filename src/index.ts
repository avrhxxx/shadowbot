// =====================================
// 📁 src/index.ts
// =====================================

import {
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";

import { createLogger } from "@/foundation/logger";
import { createAppContext, createRootContext } from "@/trace";

import { loadAllSystems } from "@/runtime/runtimeLoader";
import { ensureAllSheets } from "@/integrations/google";

import { handleUIInteraction } from "@/ui/core/uiDiscordAdapter";

// 🔥 DEV PANEL
import { handleDevpanelCommand } from "@/systems/devpanel/commands/devpanel.command";
import { devpanelSlash } from "@/systems/devpanel/commands/devpanel.slash";
import { initDevPanelForGuild } from "@/systems/devpanel/devpanel.channel";

// 🔹 MODERATOR
import { handleModeratorCommand } from "@/systems/moderator/commands/moderator.command";
import { moderatorSlash } from "@/systems/moderator/commands/moderator.slash";
import { initModeratorPanelForGuild } from "@/systems/moderator/moderator.channel";

// 🔹 EVENTS
import { registerEventMainActions } from "@/systems/events/main/event.main.actions";
import { handleEventMainCommand } from "@/systems/events/main/event.main.command";
import { eventMainSlash } from "@/systems/events/main/event.main.slash";

// =====================================
// 🔐 ENV
// =====================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN not defined");
if (!GUILD_ID) throw new Error("GUILD_ID not defined");

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

process.on("unhandledRejection", (err) => runtimeFlow.fail(err));
process.on("uncaughtException", (err) => {
  runtimeFlow.fail(err);
  process.exit(1);
});

// =====================================
// 🖱️ INTERACTIONS
// =====================================

client.on("interactionCreate", async (interaction) => {
  const ctx = createRootContext({ source: "discord" });

  const handled = await handleUIInteraction(interaction, ctx);
  if (handled) return;

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "devpanel") {
      await handleDevpanelCommand(interaction);
      return;
    }
    if (interaction.commandName === "moderator") {
      await handleModeratorCommand(interaction);
      return;
    }
    if (interaction.commandName === "events") {
      await handleEventMainCommand(interaction);
      return;
    }
  }
});

// =====================================
// 🚀 READY
// =====================================

client.once("ready", async () => {
  const discordFlow = appLog.flow("discord");
  discordFlow.stepInfo("ready", { meta: { user: client.user?.tag } });

  // =============================
  // 🧠 REGISTER COMMANDS (DEV + MODERATOR + EVENTS)
  // =============================

  const commandsFlow = appLog.flow("commands");
  commandsFlow.start();
  try {
    await client.application?.commands.set([
      devpanelSlash.toJSON(),
      moderatorSlash.toJSON(),
      eventMainSlash.toJSON(),
    ]);
    commandsFlow.success();
  } catch (err) {
    commandsFlow.fail(err);
  }

  // =============================
  // 🧠 GOOGLE INIT
  // =============================

  const googleCtx = createRootContext({ source: "system", system: "google" });
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
  // =============================

  const runtimeCtx = createRootContext({ source: "system", system: "runtime" });
  const runtimeLog = createLogger(runtimeCtx);
  const runtimeLoadFlow = runtimeLog.flow("load");
  runtimeLoadFlow.start();

  try {
    await loadAllSystems();
    runtimeLoadFlow.success();
  } catch (err) {
    runtimeLoadFlow.fail(err);
  }

  // =============================
  // 🔹 INIT DEV PANEL + MODERATOR PANEL
  // =============================

  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    discordFlow.stepInfo("ready", { meta: { msg: `Guild ${GUILD_ID} not found` } });
    return;
  }

  try {
    await initDevPanelForGuild(guild);
    await initModeratorPanelForGuild(guild);
  } catch (err) {
    discordFlow.stepInfo("ready", { meta: { msg: "Failed to init panels", err } });
  }

  // =============================
  // 🔹 INIT EVENTS SYSTEM
  // =============================

  try {
    await registerEventMainActions();
    discordFlow.stepInfo("ready", { meta: { msg: "Events system initialized" } });
  } catch (err) {
    discordFlow.stepInfo("ready", { meta: { msg: "Failed to init events system", err } });
  }
});

// =====================================
// 🔐 LOGIN
// =====================================

const loginFlow = appLog.flow("login");
loginFlow.start();

client.login(BOT_TOKEN)
  .then(() => loginFlow.success())
  .catch((err) => loginFlow.fail(err));