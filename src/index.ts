/**
 * 📁 File: src/index.ts
 * 🧠 Role: entrypoint
 */

import {
  Client,
  GatewayIntentBits,
  Partials,
  Interaction,
} from "discord.js";

// =============================
// 🧠 CORE
// =============================

import { handleSystemInteraction } from "@/core/router/systemRouter";
import { log } from "@/core/logger/log";
import {
  createAppContext,
  createChildContext,
} from "@/core/trace/TraceContext";

// =============================
// 🧩 SYSTEMS
// =============================

import { initTranslationModule } from "@/system/translation";
import { initModeratorPanel } from "@/system/moderator";

import { initEventReminders } from "@/system/events";
import { initAbsenceNotifications } from "@/system/absence";

// =============================
// 🔥 QUICKADD
// =============================

import {
  registerQuickAddListener,
  startQuickAddWorker,
} from "@/system/quickadd";

// =============================
// 🌍 INTEGRATIONS
// =============================

import { ensureAllSheets } from "@/integrations/google";

// =============================
// 🚀 CLIENT SETUP
// =============================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

if (!process.env.BOT_TOKEN) {
  throw new Error("❌ BOT_TOKEN not defined");
}

const BOT_TOKEN = process.env.BOT_TOKEN;

// =============================
// 🌍 APP CONTEXT (GLOBAL)
// =============================

const appCtx = createAppContext();
const appLog = log.ctx(appCtx);

// =============================
// 🛑 GLOBAL ERROR HANDLING
// =============================

process.on("unhandledRejection", (err) => {
  appLog.error("app.unhandled_rejection", {
    error: err instanceof Error ? err.message : String(err),
  });
});

process.on("uncaughtException", (err) => {
  appLog.error("app.uncaught_exception", {
    error: err instanceof Error ? err.message : String(err),
  });

  process.exit(1);
});

// =============================
// 🚀 READY EVENT
// =============================

client.once("clientReady", async () => {
  appLog.event("app.client.ready", {
    context: {
      user: client.user?.tag,
    },
  });

  // =============================
  // 🌍 INTEGRATIONS
  // =============================

  try {
    const ctx = createChildContext(appCtx, {
      system: "google",
    });

    await ensureAllSheets();

    log.ctx(ctx).event("app.sheets.initialized");
  } catch (err) {
    appLog.error("app.sheets.failed", err);
  }

  // =============================
  // 🔥 WORKER
  // =============================

  try {
    startQuickAddWorker();
    appLog.event("app.quickadd.worker.started");
  } catch (err) {
    appLog.error("app.quickadd.worker.failed", err);
  }

  // =============================
  // ⚙️ SLASH COMMANDS
  // =============================

  try {
    await client.application?.commands.set([]);
    appLog.event("app.slash.commands.skipped");
  } catch (err) {
    appLog.error("app.slash.commands.failed", err);
  }

  // =============================
  // 🧩 SYSTEM INIT
  // =============================

  initTranslationModule(client);
  initModeratorPanel(client);
  registerQuickAddListener(client);

  // =============================
  // 🏰 GUILD INIT
  // =============================

  await Promise.allSettled(
    Array.from(client.guilds.cache.values()).map(async (guild) => {
      const guildCtx = createChildContext(appCtx, {
        system: "app",
        guildId: guild.id,
      });

      const l = log.ctx(guildCtx);

      l.event("app.guild.init", {
        context: {
          guild: guild.name,
        },
      });

      try {
        initEventReminders(guild);
      } catch (err) {
        l.error("app.guild.events.failed", err);
      }

      try {
        await initAbsenceNotifications(guild);
      } catch (err) {
        l.error("app.guild.absence.failed", err);
      }
    })
  );
});

// =============================
// 🎯 INTERACTIONS
// =============================

client.on("interactionCreate", async (interaction: Interaction) => {
  try {
    if (!interaction.isRepliable()) return;

    await handleSystemInteraction(interaction);
  } catch (err) {
    const ctx = createChildContext(appCtx, {
      source: "discord",
      guildId: interaction.guildId ?? undefined,
      userId: interaction.user?.id,
      interactionId: interaction.id,
    });

    const l = log.ctx(ctx);

    l.error("app.interaction.error", err);

    if (interaction.isRepliable()) {
      await interaction
        .reply({
          content: "❌ An unexpected error occurred.",
          ephemeral: true,
        })
        .catch(() => null);
    }
  }
});

// =============================
// 🔐 LOGIN
// =============================

client.login(BOT_TOKEN);