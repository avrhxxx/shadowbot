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

// --- Helpers do odczytu i zapisu ---
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

// --- Handle Button ---
async function handleButton(interaction: ButtonInteraction) {
  switch (interaction.customId) {
    case "event_create":
      return showCreateModal(interaction);
    case "event_list":
      return showList(interaction);
    case "event_cancel":
      return showCancelMenu(interaction);
    case "event_manual_reminder":
      return manualReminder(interaction);
    case "event_settings":
      return showChannelSelect(interaction);
    case "event_download":
      return downloadParticipants(interaction);
    case "event_help":
      return showHelp(interaction);
  }
}

// --- Handle Modal Submit ---
async function handleModal(interaction: ModalSubmitInteraction) {
  if (!interaction.guild || interaction.customId !== "event_create_modal") return;

  const guildId = interaction.guild.id;
  const config = getConfig(guildId);
  if (!config.defaultChannelId)
    return interaction.reply({ content: "Default channel not set.", ephemeral: true });

  const name = interaction.fields.getTextInputValue("event_name");
  const day = Number(interaction.fields.getTextInputValue("event_day"));
  const month = Number(interaction.fields.getTextInputValue("event_month"));
  const time = interaction.fields.getTextInputValue("event_time");
  const reminderBefore = Number(interaction.fields.getTextInputValue("reminder_before"));

  if (!/^\d{2}:\d{2}$/.test(time)) return interaction.reply({ content: "Invalid time format.", ephemeral: true });
  if (isNaN(day) || day < 1 || day > 31) return interaction.reply({ content: "Invalid day.", ephemeral: true });
  if (isNaN(month) || month < 1 || month > 12) return interaction.reply({ content: "Invalid month.", ephemeral: true });
  if (isNaN(reminderBefore) || reminderBefore < 0) return interaction.reply({ content: "Reminder must be >= 0.", ephemeral: true });

  const [hour, minute] = time.split(":").map(Number);
  const eventDate = new Date();
  eventDate.setMonth(month - 1, day);
  eventDate.setHours(hour, minute, 0, 0);
  if (eventDate.getTime() < Date.now()) return interaction.reply({ content: "Event is in the past.", ephemeral: true });

  const events = getEvents(guildId);
  events.push({
    id: uuidv4(),
    name,
    day,
    month,
    hour,
    minute,
    reminderBefore,
    status: "ACTIVE",
    participants: [],
    createdAt: Date.now(),
    guildId,
    reminderSent: false,
  });
  saveEvents(guildId, events);

  await interaction.reply({ content: `Event **${name}** created.`, ephemeral: true });
}

// --- Handle Select Menu ---
async function handleSelect(interaction: StringSelectMenuInteraction) {
  if (!interaction.guild) return;
  const guildId = interaction.guild.id;

  if (interaction.customId === "cancel_select") {
    const id = interaction.values[0];
    const events = getEvents(guildId);
    const event = events.find((e) => e.id === id);
    if (event) { event.status = "CANCELLED"; saveEvents(guildId, events); }
    return interaction.reply({ content: "Event cancelled.", ephemeral: true });
  }

  if (interaction.customId === "channel_select") {
    const channelId = interaction.values[0];
    setConfig(guildId, { defaultChannelId: channelId });
    return interaction.reply({ content: "Default channel updated.", ephemeral: true });
  }

  if (interaction.customId === "download_select") {
    const id = interaction.values[0];
    const events = getEvents(guildId);
    const event = events.find((e) => e.id === id);
    if (!event) return interaction.reply({ content: "Event not found.", ephemeral: true });

    const content = `Event: ${event.name}\nDate: ${event.day}/${event.month}\nParticipants:\n${event.participants.join("\n") || "None"}`;
    const channel = interaction.guild.channels.cache.get(getConfig(guildId).defaultChannelId) as TextChannel;
    if (channel) await channel.send({ content });
    return interaction.reply({ content: "Participants sent.", ephemeral: true });
  }
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

      if (changed) saveEvents(guildId, events);
    }
  }, 60 * 1000);
}

// --- Render Event Panel ---
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