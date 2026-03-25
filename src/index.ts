// =====================================
// 📁 src/index.ts
// =====================================

/**
 * 🧠 ROLE:
 * Main application entry point.
 *
 * Responsible for:
 * - bootstrapping Discord client
 * - initializing modules
 * - registering QuickAdd system (commands + listener + worker)
 * - wiring global interaction handlers
 *
 * ❗ RULES:
 * - no business logic here
 * - only orchestration / initialization
 */

// 🔥 INIT GOOGLE CLIENT
import "./google/googleSheetsClient";

import {
  Client,
  GatewayIntentBits,
  Partials,
  Interaction,
} from "discord.js";

import { initTranslationModule } from "./modules/TranslationModule";
import { initModeratorPanel } from "./moderatorPanel/moderatorPanel";
import { handleEventInteraction } from "./eventsPanel/eventHandlers";
import { initEventReminders } from "./eventsPanel/eventsButtons/eventsReminder";
import { handleAbsenceInteraction } from "./absencePanel/absenceHandler";
import { initAbsenceNotifications } from "./absencePanel/absenceButtons/absenceNotification";
import { handlePointsInteraction } from "./pointsPanel/pointsHandler";

// =============================
// 🔥 QUICKADD (NEW ARCHITECTURE)
// =============================

// ❗ FIX: zgodnie z repo — CommandBuilder i CommandRouter są w discord/
import { qCommand } from "./quickadd/discord/CommandBuilder";
import { handleQuickAddInteraction } from "./quickadd/discord/CommandRouter";

// ❗ FIX: zgodnie z repo — ChannelManager (nie Service)
import { ensureQuickAddChannel } from "./quickadd/integrations/QuickAddChannelManager";

// ❗ FIX: listener w warstwie discord/
import { registerQuickAddListener } from "./quickadd/discord/QuickAddListener";

// 🔥 FIX — PATH
import { ensureAllSheets } from "./google/googleSheetsStorage";

// 🔥 NEW — QUEUE WORKER (zgodne z repo)
import { startQuickAddWorker } from "./quickadd/integrations/QuickAddQueueWorker";

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

client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);

  // 🔥 SELF HEALING SHEETS (CRITICAL)
  try {
    await ensureAllSheets();
    console.log("✅ Sheets structure verified");
  } catch (err) {
    console.error("❌ Sheets init failed:", err);
  }

  // 🔥 START QUICKADD WORKER
  try {
    startQuickAddWorker();
    console.log("✅ QuickAdd worker started");
  } catch (err) {
    console.error("❌ QuickAdd worker failed:", err);
  }

  // =============================
  // 🔥 REGISTER SLASH COMMANDS
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

  // -----------------------------
  // Init modules
  // -----------------------------
  initTranslationModule(client);
  initModeratorPanel(client);

  // 🔥 LISTENER
  registerQuickAddListener(client);

  // -----------------------------
  for (const guild of client.guilds.cache.values()) {
    try {
      await ensureQuickAddChannel(guild);
      console.log(`✅ QuickAdd channel ready in ${guild.name}`);
    } catch (err) {
      console.error(`❌ QuickAdd channel error in ${guild.name}:`, err);
    }

    initEventReminders(guild);

    initAbsenceNotifications(guild).catch((err: any) => {
      console.error(
        `❌ Error initializing absence notifications for guild ${guild.id}:`,
        err
      );
    });
  }

  // =============================
  // 🔥 GLOBAL HANDLER
  // =============================
  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "q") {
          await handleQuickAddInteraction(interaction);
          return;
        }
      }

      await handleEventInteraction(interaction);
      await handleAbsenceInteraction(interaction);
      await handlePointsInteraction(interaction);

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
});

client.login(BOT_TOKEN);

/**
 * =====================================
 * ✅ CHANGES (INDEX)
 * =====================================
 *
 * 1. Import paths verified against repo structure:
 *    - CommandBuilder → ./quickadd/discord/CommandBuilder
 *    - CommandRouter → ./quickadd/discord/CommandRouter
 *    - QuickAddListener → ./quickadd/discord/QuickAddListener
 *    - QuickAddChannelManager → integrations layer
 *    - QuickAddQueueWorker → integrations layer
 *
 * 2. Removed legacy paths:
 *    - ❌ ./quickadd/commands/*
 *    - ❌ QuickAddChannelService
 *
 * 3. File now consistent with:
 *    core → discord → integrations architecture
 *
 * 4. No logic changes — only import correctness (as required)
 */