/**
 * 📁 File: src/index.ts
 * 🧠 Role: entrypoint
 *
 * 📄 Description:
 * Główny entrypoint aplikacji Discord.
 * Odpowiada za:
 * - inicjalizację klienta
 * - bootstrap systemów
 * - routing interakcji
 *
 * 📥 Input:
 * - Discord events
 *
 * 📤 Output:
 * - uruchomiona aplikacja + logi
 *
 * 🔗 Dependencies:
 * - discord.js
 * - core (router, logger, trace)
 * - system modules
 *
 * 📡 Used by:
 * - runtime (node)
 *
 * 🆔 Flow:
 * - traceId: TAK (app lifecycle)
 * - sessionId: NIE
 * - queueId: NIE
 *
 * 📊 Logging:
 * - logger: TAK
 * - level: high
 *
 * ⚠️ Notes:
 * - systemRouter zarządza trace dla interakcji
 * - init moduły NIE używają ctx (API ograniczenie)
 */

import "./integrations/google/googleSheetsClient";

import {
  Client,
  GatewayIntentBits,
  Partials,
  Interaction,
} from "discord.js";

// =============================
// 🧠 CORE
// =============================

import { handleSystemInteraction } from "./core/router/systemRouter";
import { log } from "./core/logger/log";
import {
  createAppContext,
  createChildContext,
} from "./core/trace/TraceContext";

// =============================
// 🧩 SYSTEMS (INIT ONLY)
// =============================

import { initTranslationModule } from "./system/translation";
import { initModeratorPanel } from "./system/moderator";

import { initEventReminders } from "./system/events";
import { initAbsenceNotifications } from "./system/absence";

// =============================
// 🔥 QUICKADD (SPECIAL SYSTEM)
// =============================

import {
  registerQuickAddListener,
  startQuickAddWorker,
} from "./system/quickadd";

// =============================
// 🌍 INTEGRATIONS
// =============================

import { ensureAllSheets } from "./integrations/google";

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
// 🚀 READY EVENT
// =============================

client.once("clientReady", async () => {
  const appCtx = createAppContext();
  const logger = log.ctx(appCtx);

  logger.event("app.client.ready", {
    context: {
      user: client.user?.tag,
    },
  });

  // =============================
  // 🌍 INTEGRATIONS INIT
  // =============================

  try {
    await ensureAllSheets();

    logger.event("app.sheets.initialized");
  } catch (err) {
    logger.error("app.sheets.failed", err);
  }

  // =============================
  // 🔥 QUICKADD WORKER
  // =============================

  try {
    startQuickAddWorker();

    logger.event("app.quickadd.worker.started");
  } catch (err) {
    logger.error("app.quickadd.worker.failed", err);
  }

  // =============================
  // ⚙️ SLASH COMMANDS
  // =============================

  try {
    await client.application?.commands.set([]);

    logger.event("app.slash.commands.skipped");
  } catch (err) {
    logger.error("app.slash.commands.failed", err);
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

  await Promise.all(
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
    const ctx = createAppContext();
    const logger = log.ctx(ctx);

    logger.error("app.interaction.error", err);

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