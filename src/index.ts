// =====================================
// 📁 src/index.ts
// =====================================

/**
 * 🧠 ROLE:
 * Application entrypoint
 *
 * Responsibilities:
 * - bootstrap integrations
 * - initialize systems (via runtime)
 * - manage lifecycle
 *
 * ❗ RULES:
 * - NO business logic
 * - MUST propagate ctx
 * - MUST use structured logging
 */

// =====================================
// 🔹 BOOTSTRAP (SIDE EFFECTS)
// =====================================

import "@/integrations/google/googleSheetsClient";

// =====================================
// 🔹 LIBS
// =====================================

import {
  Client,
  GatewayIntentBits,
  Partials,
  Interaction,
} from "discord.js";

// =====================================
// 🔹 CORE
// =====================================

import { handleSystemInteraction } from "@/core/router/systemRouter";
import { log } from "@/core/logger/log";
import {
  createAppContext,
  createChildContext,
} from "@/core/trace/TraceContext";

// =====================================
// 🔹 RUNTIME
// =====================================

import {
  loadGlobalSystems,
  loadGuildSystems,
} from "@/runtime/systemLoader";

// =====================================
// 🔹 INTEGRATIONS
// =====================================

import { ensureAllSheets } from "@/integrations/google";

// =====================================
// 🔹 CLIENT SETUP
// =====================================

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

// =====================================
// 🔹 APP CONTEXT
// =====================================

const appCtx = createAppContext();
const appLog = log.ctx(appCtx);

// =====================================
// 🔹 ERROR NORMALIZATION
// =====================================

function normalizeError(err: unknown) {
  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
    };
  }

  return {
    message: String(err),
  };
}

// =====================================
// 🔹 GLOBAL ERROR HANDLING
// =====================================

process.on("unhandledRejection", (err) => {
  appLog.error("app.unhandled_rejection", normalizeError(err));
});

process.on("uncaughtException", (err) => {
  appLog.error("app.uncaught_exception", normalizeError(err));
  process.exit(1);
});

// =====================================
// 🔹 READY EVENT
// =====================================

client.once("clientReady", async () => {
  appLog.event("app.client.ready", {
    context: {
      user: client.user?.tag,
    },
  });

  // =============================
  // 🌍 INTEGRATIONS (CRITICAL)
  // =============================

  let sheetsReady = false;

  try {
    const ctx = createChildContext(appCtx, {
      system: "google",
    });

    await ensureAllSheets();

    log.ctx(ctx).event("app.sheets.initialized");

    sheetsReady = true;
  } catch (err) {
    appLog.error("app.sheets.failed", normalizeError(err));
  }

  // ❌ HARD GUARD — runtime depends on sheets
  if (!sheetsReady) {
    appLog.error("app.bootstrap.aborted", {
      reason: "sheets_not_ready",
    });
    return;
  }

  // =============================
  // ⚙️ SLASH COMMANDS
  // =============================

  try {
    await client.application?.commands.set([]);
    appLog.event("app.slash.commands.skipped");
  } catch (err) {
    appLog.error("app.slash.commands.failed", normalizeError(err));
  }

  // =============================
  // 🧠 RUNTIME — GLOBAL SYSTEMS
  // =============================

  try {
    const ctx = createChildContext(appCtx, {
      system: "runtime",
    });

    log.ctx(ctx).event("runtime.start");

    await loadGlobalSystems(client, ctx);
  } catch (err) {
    appLog.error("app.runtime.global.failed", normalizeError(err));
  }

  // =============================
  // 🏰 RUNTIME — GUILD SYSTEMS
  // =============================

  const results = await Promise.allSettled(
    Array.from(client.guilds.cache.values()).map(async (guild) => {
      const guildCtx = createChildContext(appCtx, {
        system: "runtime",
        guildId: guild.id,
      });

      const l = log.ctx(guildCtx);

      l.event("app.guild.init", {
        context: {
          guild: guild.name,
        },
      });

      try {
        await loadGuildSystems(guild, guildCtx);
      } catch (err) {
        l.error("app.runtime.guild.failed", normalizeError(err));
      }
    })
  );

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      appLog.error("app.guild.init.failed", {
        index: i,
        ...normalizeError(r.reason),
      });
    }
  });
});

// =====================================
// 🔹 INTERACTIONS
// =====================================

client.on("interactionCreate", async (interaction: Interaction) => {
  try {
    if (!interaction.isRepliable()) return;

    await handleSystemInteraction(interaction);
  } catch (err) {
    const ctx = createChildContext(appCtx, {
      source: "discord",
      guildId: interaction.guildId ?? undefined,
      userId: interaction.user.id,
      interactionId: interaction.id,
    });

    const l = log.ctx(ctx);

    l.error("app.interaction.error", normalizeError(err));

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

// =====================================
// 🔐 LOGIN
// =====================================

client.login(BOT_TOKEN);