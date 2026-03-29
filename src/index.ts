// =====================================
// 📁 src/index.ts
// =====================================

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
import { logger } from "./core/logger/log";

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
  qCommand,
  handleQuickAddCommand,
  ensureQuickAddChannel,
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
  logger.emit({
    scope: "app",
    event: "client_ready",
    context: {
      user: client.user?.tag,
    },
  });

  // =============================
  // 🌍 INTEGRATIONS INIT
  // =============================

  try {
    await ensureAllSheets();

    logger.emit({
      scope: "app",
      event: "sheets_initialized",
    });
  } catch (err) {
    logger.emit({
      scope: "app",
      event: "sheets_init_failed",
      level: "error",
      error: err,
    });
  }

  // =============================
  // 🔥 QUICKADD WORKER
  // =============================

  try {
    startQuickAddWorker();

    logger.emit({
      scope: "app",
      event: "quickadd_worker_started",
    });
  } catch (err) {
    logger.emit({
      scope: "app",
      event: "quickadd_worker_failed",
      level: "error",
      error: err,
    });
  }

  // =============================
  // ⚙️ SLASH COMMANDS
  // =============================

  try {
    await client.application?.commands.set([]);

    await client.application?.commands.set([
      qCommand.toJSON(),
    ]);

    logger.emit({
      scope: "app",
      event: "slash_commands_registered",
    });
  } catch (err) {
    logger.emit({
      scope: "app",
      event: "slash_commands_failed",
      level: "error",
      error: err,
    });
  }

  // =============================
  // 🧩 SYSTEM INIT
  // =============================

  initTranslationModule(client);
  initModeratorPanel(client);
  registerQuickAddListener(client);

  // =============================
  // 🏰 GUILD INIT (PARALLEL)
  // =============================

  await Promise.all(
    Array.from(client.guilds.cache.values()).map(async (guild) => {
      try {
        await ensureQuickAddChannel(guild);

        logger.emit({
          scope: "app.guild",
          event: "quickadd_channel_ready",
          context: {
            guild: guild.name,
          },
        });
      } catch (err) {
        logger.emit({
          scope: "app.guild",
          event: "quickadd_channel_failed",
          level: "error",
          context: {
            guild: guild.name,
          },
          error: err,
        });
      }

      try {
        initEventReminders(guild);
      } catch (err) {
        logger.emit({
          scope: "app.guild",
          event: "event_reminders_failed",
          level: "error",
          context: {
            guild: guild.name,
          },
          error: err,
        });
      }

      try {
        await initAbsenceNotifications(guild);
      } catch (err) {
        logger.emit({
          scope: "app.guild",
          event: "absence_notifications_failed",
          level: "error",
          context: {
            guild: guild.id,
          },
          error: err,
        });
      }
    })
  );
});

// =============================
// 🎯 INTERACTIONS
// =============================

client.on("interactionCreate", async (interaction: Interaction) => {
  try {
    // =============================
    // 🔥 QUICKADD COMMAND (SPECIAL CASE)
    // =============================

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "q") {
        await handleQuickAddCommand(interaction);
        return;
      }
    }

    // =============================
    // 🧠 SYSTEM ROUTER
    // =============================

    if (!interaction.isRepliable()) return;

    await handleSystemInteraction(interaction);
  } catch (err) {
    logger.emit({
      scope: "app",
      event: "interaction_error",
      level: "error",
      error: err,
    });

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