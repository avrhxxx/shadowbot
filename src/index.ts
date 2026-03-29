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
  console.log(`✅ Logged in as ${client.user?.tag}`);

  // =============================
  // 🌍 INTEGRATIONS INIT
  // =============================

  try {
    await ensureAllSheets();
    console.log("✅ Sheets structure verified");
  } catch (err) {
    console.error("❌ Sheets init failed:", err);
  }

  // =============================
  // 🔥 QUICKADD WORKER
  // =============================

  try {
    startQuickAddWorker();
    console.log("✅ QuickAdd worker started");
  } catch (err) {
    console.error("❌ QuickAdd worker failed:", err);
  }

  // =============================
  // ⚙️ SLASH COMMANDS
  // =============================

  try {
    await client.application?.commands.set([]);

    await client.application?.commands.set([
      qCommand.toJSON(),
    ]);

    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error("❌ Slash command registration failed:", err);
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
        console.log(`✅ QuickAdd channel ready in ${guild.name}`);
      } catch (err) {
        console.error(
          `❌ QuickAdd channel error in ${guild.name}:`,
          err
        );
      }

      try {
        initEventReminders(guild);
      } catch (err) {
        console.error(
          `❌ Event reminders error in ${guild.name}:`,
          err
        );
      }

      try {
        await initAbsenceNotifications(guild);
      } catch (err) {
        console.error(
          `❌ Absence notifications error in ${guild.id}:`,
          err
        );
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
    console.error("❌ interactionCreate error:", err);

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