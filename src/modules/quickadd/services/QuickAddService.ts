// src/index.ts
import "./googleSheetsClient"; // 🔹 Google Sheets klient

import { Client, GatewayIntentBits, Partials, Interaction } from "discord.js";
import { initTranslationModule } from "./modules/TranslationModule";
import { initModeratorPanel } from "./moderatorPanel/moderatorPanel";
import { handleEventInteraction } from "./eventsPanel/eventHandlers";
import { initEventReminders } from "./eventsPanel/eventsButtons/eventsReminder";
import { handleAbsenceInteraction } from "./absencePanel/absenceHandler";
import { initAbsenceNotifications } from "./absencePanel/absenceButtons/absenceNotification";
import { handlePointsInteraction } from "./pointsPanel/pointsHandler"; // 🔹 obsługa points panel

// -----------------------------
// QuickAdd (placeholder import dla komend)
// -----------------------------
import { registerQuickAddCommands } from "./modules/quickadd/commands/QuickAddCommandRegistry";
import { QuickAddService } from "./modules/quickadd/services/QuickAddService"; // 🔹 serwis obsługujący kanał

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
  // Init modules
  // -----------------------------
  initTranslationModule(client);
  initModeratorPanel(client);

  // -----------------------------
  // Init event reminders i absence notifications
  // -----------------------------
  for (const guild of client.guilds.cache.values()) {
    initEventReminders(guild);
    initAbsenceNotifications(guild).catch(err => {
      console.error(`Error initializing absence notifications for guild ${guild.id}:`, err);
    });
  }

  // -----------------------------
  // QuickAdd: tworzenie kanału i rejestracja komend
  // -----------------------------
  const quickAddService = new QuickAddService(client);

  for (const guild of client.guilds.cache.values()) {
    await quickAddService.ensureQuickAddChannel(guild); // 🔹 tworzy #quickadd jeśli nie istnieje
  }

  registerQuickAddCommands(client); // 🔹 rejestruje wszystkie komendy QuickAdd

  // -----------------------------
  // Global interaction handler
  // -----------------------------
  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      // Obsługa eventów
      await handleEventInteraction(interaction);

      // Obsługa absence panel
      await handleAbsenceInteraction(interaction);

      // Obsługa points panel
      await handlePointsInteraction(interaction);

      // QuickAdd sesyjne komendy działają tylko w kanale #quickadd
      // dzięki QuickAddSessionManager (sprawdzi channel.id)
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