// src/index.ts
import "./googleSheetsClient";

import {
  Client,
  GatewayIntentBits,
  Partials,
  Interaction,
  ChannelType,
} from "discord.js";

import { initTranslationModule } from "./modules/TranslationModule";
import { initModeratorPanel } from "./moderatorPanel/moderatorPanel";
import { handleEventInteraction } from "./eventsPanel/eventHandlers";
import { initEventReminders } from "./eventsPanel/eventsButtons/eventsReminder";
import { handleAbsenceInteraction } from "./absencePanel/absenceHandler";
import { initAbsenceNotifications } from "./absencePanel/absenceButtons/absenceNotification";
import { handlePointsInteraction } from "./pointsPanel/pointsHandler";

// -----------------------------
// ✅ QuickAdd (NOWY SYSTEM)
// -----------------------------
import { registerQuickAddListener } from "./quickadd/QuickAddListener";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN not defined");
const BOT_TOKEN = process.env.BOT_TOKEN;

client.once("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}`);

  // -----------------------------
  // 🔥 TWORZENIE #quick-add
  // -----------------------------
  for (const guild of client.guilds.cache.values()) {
    try {
      const existing = guild.channels.cache.find(
        (c) =>
          c.name === "quick-add" &&
          c.type === ChannelType.GuildText
      );

      if (!existing) {
        await guild.channels.create({
          name: "quick-add",
          type: ChannelType.GuildText,
        });

        console.log(`✅ Created #quick-add in ${guild.name}`);
      }
    } catch (err) {
      console.error(`❌ Error creating quick-add in ${guild.name}:`, err);
    }
  }

  // -----------------------------
  // Init modules
  // -----------------------------
  initTranslationModule(client);
  initModeratorPanel(client);

  // -----------------------------
  // Init reminders / notifications
  // -----------------------------
  for (const guild of client.guilds.cache.values()) {
    initEventReminders(guild);
    initAbsenceNotifications(guild).catch(err => {
      console.error(`Error initializing absence notifications for guild ${guild.id}:`, err);
    });
  }

  // -----------------------------
  // ✅ QuickAdd
  // -----------------------------
  registerQuickAddListener(client);

  // -----------------------------
  // Global interaction handler
  // -----------------------------
  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      await handleEventInteraction(interaction);
      await handleAbsenceInteraction(interaction);
      await handlePointsInteraction(interaction);
    } catch (err) {
      console.error("Error in interactionCreate:", err);

      if (interaction.isRepliable()) {
        await interaction.reply({
          content: "❌ An unexpected error occurred.",
          ephemeral: true,
        }).catch(() => null);
      }
    }
  });
});

client.login(BOT_TOKEN);