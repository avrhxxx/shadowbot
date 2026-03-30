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

import "@/integrations/google/googleSheetsClient";

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
// 🧩 SYSTEMS (INIT ONLY)
// =============================

import { initTranslationModule } from "@/system/translation";
import { initModeratorPanel } from "@/system/moderator";

import { initEventReminders } from "@/system/events";
import { initAbsenceNotifications } from "@/system/absence";

// =============================
// 🔥 QUICKADD (SPECIAL SYSTEM)
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
// 🛑 GLOBAL ERROR HANDLING
// =============================

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED_REJECTION", err);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT_EXCEPTION", err);
});

// =============================
// 🚀 READY EVENT
// =============================

client.once("clientReady", async () => {
  const appCtx = createAppContext();
  const l = log.ctx(appCtx);

  l.event("app.client.ready", {
    context: {
      user: client.user?.tag,
    },
  });

  try {
    await ensureAllSheets();
    l.event("app.sheets.initialized");
  } catch (err) {
    l.error("app.sheets.failed", err);
  }

  try {
    startQuickAddWorker();
    l.event("app.quickadd.worker.started");
  } catch (err) {
    l.error("app.quickadd.worker.failed", err);
  }

  try {
    await client.application?.commands.set([]);
    l.event("app.slash.commands.skipped");
  } catch (err) {
    l.error("app.slash.commands.failed", err);
  }

  initTranslationModule(client);
  initModeratorPanel(client);
  registerQuickAddListener(client);

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
    console.error("INTERACTION_ERROR", err);

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

await client.login(BOT_TOKEN);