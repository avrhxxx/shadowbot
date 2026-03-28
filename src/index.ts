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
// 🧩 SYSTEMS (INDEX-BASED)
// =============================

import { initTranslationModule } from "./system/translation";
import { initModeratorPanel } from "./system/moderator";

import { initEventReminders } from "./system/events";
import { initAbsenceNotifications } from "./system/absence";

// 👉 SYSTEM ROUTER (NOWY)
import { handleSystemInteraction } from "./core/systemRouter";

// =============================
// 🔥 QUICKADD (SYSTEM)
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

  try {
    await ensureAllSheets();
    console.log("✅ Sheets structure verified");
  } catch (err) {
    console.error("❌ Sheets init failed:", err);
  }

  try {
    startQuickAddWorker();
    console.log("✅ QuickAdd worker started");
  } catch (err) {
    console.error("❌ QuickAdd worker failed:", err);
  }

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
  // 🔧 MODULE INIT
  // =============================

  initTranslationModule(client);
  initModeratorPanel(client);
  registerQuickAddListener(client);

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
  // 🎯 INTERACTIONS
  // =============================

  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      // =============================
      // 🔥 QUICKADD COMMAND
      // =============================

      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "q") {
          await handleQuickAddCommand(interaction);
          return;
        }
      }

      // =============================
      // 🧠 SYSTEM ROUTER (NOWY)
      // =============================

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
});

client.login(BOT_TOKEN);