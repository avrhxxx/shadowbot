import {
  Client,
  Interaction,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  CacheType,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  TextChannel,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// --- Ścieżki danych ---
const DATA_DIR = path.resolve("./data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

// --- Inicjalizacja plików ---
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(EVENTS_FILE)) fs.writeFileSync(EVENTS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({}, null, 2));

// --- Typy ---
interface EventObject {
  id: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  reminderBefore: number;
  status: "ACTIVE" | "PAST" | "CANCELLED";
  participants: string[];
  createdAt: number;
  guildId: string;
  reminderSent?: boolean;
}

// --- Helpers ---
function getEvents(guildId: string): EventObject[] {
  const data = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));
  return data[guildId]?.events || [];
}

function saveEvents(guildId: string, events: EventObject[]) {
  const data = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));
  data[guildId] = { events };
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(data, null, 2));
}

function getConfig(guildId: string) {
  const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  return data[guildId] || {};
}

function setConfig(guildId: string, config: any) {
  const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  data[guildId] = config;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

// --- Init Event Panel ---
export function initEventPanel(client: Client) {
  client.on("interactionCreate", async (interaction: Interaction<CacheType>) => {
    if (interaction.isButton()) await handleButton(interaction);
    if (interaction.isModalSubmit()) await handleModal(interaction);
    if (interaction.isStringSelectMenu()) await handleSelect(interaction);
  });

  // --- Scheduler co minutę ---
  setInterval(() => {
    const guildData = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));
    const now = Date.now();

    for (const guildId in guildData) {
      const events: EventObject[] = guildData[guildId].events;
      const config = getConfig(guildId);
      const channelId = config.defaultChannelId;

      if (!channelId) continue;

      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;
      const channel = guild.channels.cache.get(channelId) as TextChannel;
      if (!channel) continue;

      let changed = false;

      for (const event of events) {
        const eventTime = new Date(new Date().getFullYear(), event.month - 1, event.day, event.hour, event.minute).getTime();

        // przypomnienie
        if (event.status === "ACTIVE" && !event.reminderSent && now >= eventTime - event.reminderBefore * 60000) {
          channel.send(`Reminder: **${event.name}** at <t:${Math.floor(eventTime / 1000)}:F>`);
          event.reminderSent = true;
          changed = true;
        }

        // zmiana statusu na PAST
        if (event.status === "ACTIVE" && now >= eventTime) {
          event.status = "PAST";
          changed = true;
        }
      }

      if (changed) {
        saveEvents(guildId, events);
      }
    }
  }, 60 * 1000);
}

// --- Render Event Panel (Opcja A) ---
export async function renderEventPanel(channel: TextChannel) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("event_create").setLabel("Create Event").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("event_list").setLabel("List Events").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("event_settings").setLabel("Settings").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("event_manual_reminder").setLabel("Manual Reminder").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("event_cancel").setLabel("Cancel Event").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("event_download").setLabel("Download Participants").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("event_help").setLabel("Help").setStyle(ButtonStyle.Success)
  );

  await channel.send({
    content: "📌 **Event Panel**",
    components: [row],
  });
}

// --- Tutaj reszta EventPanel.ts zostaje dokładnie taka, jak była ---
// handleButton, handleModal, handleSelect, showCreateModal, showList, showCancelMenu, manualReminder itd.