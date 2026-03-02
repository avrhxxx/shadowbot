// src/events/eventPanel.ts
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

// --- Button handler ---
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

// --- Create Event Modal ---
async function showCreateModal(interaction: ButtonInteraction) {
  const modal = new ModalBuilder().setCustomId("event_create_modal").setTitle("Create Event");

  const nameInput = new TextInputBuilder().setCustomId("event_name").setLabel("Event Name").setStyle(TextInputStyle.Short);
  const dayInput = new TextInputBuilder().setCustomId("event_day").setLabel("Day (1-31)").setStyle(TextInputStyle.Short);
  const monthInput = new TextInputBuilder().setCustomId("event_month").setLabel("Month (1-12)").setStyle(TextInputStyle.Short);
  const timeInput = new TextInputBuilder().setCustomId("event_time").setLabel("Time (HH:MM)").setStyle(TextInputStyle.Short);
  const reminderInput = new TextInputBuilder().setCustomId("reminder_before").setLabel("Reminder Before (minutes)").setStyle(TextInputStyle.Short);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(reminderInput)
  );

  await interaction.showModal(modal);
}

// --- Modal submit handler ---
async function handleModal(interaction: ModalSubmitInteraction) {
  if (interaction.customId !== "event_create_modal" || !interaction.guild) return;

  const guildId = interaction.guild.id;
  const config = getConfig(guildId);
  if (!config.defaultChannelId) return interaction.reply({ content: "Default channel not set.", ephemeral: true });

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
  events.push({ id: uuidv4(), name, day, month, hour, minute, reminderBefore, status: "ACTIVE", participants: [], createdAt: Date.now(), guildId, reminderSent: false });
  saveEvents(guildId, events);

  await interaction.reply({ content: `Event **${name}** created.`, ephemeral: true });
}

// --- List Events ---
async function showList(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  const guildId = interaction.guild.id;
  const events = getEvents(guildId);
  if (!events.length) return interaction.reply({ content: "No events.", ephemeral: true });

  const formatted = events
    .map((e) => {
      const statusEmoji = e.status === "ACTIVE" ? "🟢" : e.status === "PAST" ? "🔴" : "⚪";
      const ts = Math.floor(new Date(new Date().getFullYear(), e.month - 1, e.day, e.hour, e.minute).getTime() / 1000);
      return `• ${statusEmoji} **${e.name}** - <t:${ts}:F>`;
    })
    .join("\n");

  await interaction.reply({ content: formatted, ephemeral: true });
}

// --- Cancel Event ---
async function showCancelMenu(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  const guildId = interaction.guild.id;
  const events = getEvents(guildId).filter((e) => e.status === "ACTIVE");
  if (!events.length) return interaction.reply({ content: "No active events.", ephemeral: true });

  const select = new StringSelectMenuBuilder().setCustomId("cancel_select").setPlaceholder("Select event to cancel").addOptions(events.map((e) => ({ label: e.name, value: e.id })));
  await interaction.reply({ components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)], ephemeral: true });
}

// --- Select handler ---
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

// --- Settings channel select ---
async function showChannelSelect(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  const channels = interaction.guild.channels.cache.filter((c) => c.isTextBased()).map((c) => ({ label: c.name, value: c.id }));
  const select = new StringSelectMenuBuilder().setCustomId("channel_select").setPlaceholder("Select default channel").addOptions(channels);
  await interaction.reply({ components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)], ephemeral: true });
}

// --- Manual Reminder ---
async function manualReminder(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  const guildId = interaction.guild.id;
  const config = getConfig(guildId);
  const channel = interaction.guild.channels.cache.get(config.defaultChannelId) as TextChannel;
  if (!channel) return interaction.reply({ content: "Channel not found.", ephemeral: true });

  const events = getEvents(guildId).filter((e) => e.status === "ACTIVE");
  for (const e of events) {
    const ts = Math.floor(new Date(new Date().getFullYear(), e.month - 1, e.day, e.hour, e.minute).getTime() / 1000);
    await channel.send(`Reminder: **${e.name}** at <t:${ts}:F>`);
  }
  await interaction.reply({ content: "Reminders sent.", ephemeral: true });
}

// --- Download Participants ---
async function downloadParticipants(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  const guildId = interaction.guild.id;
  const events = getEvents(guildId).filter((e) => e.status === "PAST");
  if (!events.length) return interaction.reply({ content: "No past events.", ephemeral: true });

  const select = new StringSelectMenuBuilder().setCustomId("download_select").setPlaceholder("Select past event").addOptions(events.map((e) => ({ label: e.name, value: e.id })));
  await interaction.reply({ components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)], ephemeral: true });
}

// --- Help ---
async function showHelp(interaction: ButtonInteraction) {
  const helpText = `
**Event Panel Help**
• Create Event – event_create
• List Events – event_list
• ⚙️ Settings – event_settings
• 🔔 Manual Reminder – event_manual_reminder
• 🗑️ Cancel Event – event_cancel
• ⬇️ Download Participants – event_download
`;
  await interaction.reply({ content: helpText, ephemeral: true });
}