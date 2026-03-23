// =====================================
// 📁 src/index.ts
// =====================================

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

// ❌ USUWAMY stare:
// quickAddCommand
// handleQuickAddCommand
// qaCommand
// handleQaCommand

// ✅ NOWE:
import { qaCommand, quickAddCommand } from "./quickadd/commands/qa/qa.command";
import { handleQuickAddInteraction } from "./quickadd/commands/CommandHandler";

import { ensureQuickAddChannel } from "./quickadd/integrations/QuickAddChannelService";
import { registerQuickAddListener } from "./quickadd/QuickAddListener";

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

  // =============================
  // 🔥 REGISTER SLASH COMMANDS
  // =============================
  try {
    await client.application?.commands.set([
      quickAddCommand.toJSON(),
      qaCommand.toJSON(),
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
        if (
          interaction.commandName === "quickadd" ||
          interaction.commandName === "qa"
        ) {
          await handleQuickAddInteraction(interaction);
          return;
        }
      }

      // -----------------------------
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