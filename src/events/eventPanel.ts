import {
  Client,
  Interaction,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  CacheType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  TextChannel,
} from "discord.js";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Ścieżki danych
const DATA_DIR = path.resolve("./data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

// --- Inicjalizacja plików ---
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(EVENTS_FILE)) fs.writeFileSync(EVENTS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({}, null, 2));

// --- Storage helper ---
function getEvents(guildId: string) {
  const data = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));
  return data[guildId]?.events || [];
}

function saveEvents(guildId: string, events: any[]) {
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

// --- EventPanel Init ---
export function initEventPanel(client: Client) {
  client.on("interactionCreate", async (interaction: Interaction<CacheType>) => {
    if (interaction.isButton()) await handleButton(interaction);
    if (interaction.isModalSubmit()) await handleModal(interaction);
    if (interaction.isStringSelectMenu()) await handleSelect(interaction);
  });
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
  const modal = new ModalBuilder()
    .setCustomId("event_create_modal")
    .setTitle("Create Event");

  const title = new TextInputBuilder()
    .setCustomId("event_name")
    .setLabel("Event Name")
    .setStyle(TextInputStyle.Short);

  const day = new TextInputBuilder()
    .setCustomId("event_day")
    .setLabel("Day (1-31)")
    .setStyle(TextInputStyle.Short);

  const month = new TextInputBuilder()
    .setCustomId("event_month")
    .setLabel("Month (1-12)")
    .setStyle(TextInputStyle.Short);

  const time = new TextInputBuilder()
    .setCustomId("event_time")
    .setLabel("Time (HH:MM 24h)")
    .setStyle(TextInputStyle.Short);

  const reminder = new TextInputBuilder()
    .setCustomId("reminder_before")
    .setLabel("Reminder before (minutes)")
    .setStyle(TextInputStyle.Short);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(title),
    new ActionRowBuilder<TextInputBuilder>().addComponents(day),
    new ActionRowBuilder<TextInputBuilder>().addComponents(month),
    new ActionRowBuilder<TextInputBuilder>().addComponents(time),
    new ActionRowBuilder<TextInputBuilder>().addComponents(reminder)
  );

  await interaction.showModal(modal);
}

// --- Modal submit handler ---
async function handleModal(interaction: ModalSubmitInteraction) {
  if (interaction.customId !== "event_create_modal") return;
  if (!interaction.guild) return;

  const guildId = interaction.guild.id;
  const config = getConfig(guildId);

  if (!config.defaultChannelId) {
    return interaction.reply({
      content: "Default channel not set. Use ⚙️ Settings first.",
      ephemeral: true,
    });
  }

  const name = interaction.fields.getTextInputValue("event_name");
  const day = Number(interaction.fields.getTextInputValue("event_day"));
  const month = Number(interaction.fields.getTextInputValue("event_month"));
  const time = interaction.fields.getTextInputValue("event_time"); // HH:MM
  const reminderBefore = Number(interaction.fields.getTextInputValue("reminder_before"));

  // --- Walidacja ---
  if (isNaN(day) || day < 1 || day > 31)
    return interaction.reply({ content: "Invalid day.", ephemeral: true });
  if (isNaN(month) || month < 1 || month > 12)
    return interaction.reply({ content: "Invalid month.", ephemeral: true });
  if (!/^\d{2}:\d{2}$/.test(time))
    return interaction.reply({ content: "Invalid time format.", ephemeral: true });
  if (isNaN(reminderBefore) || reminderBefore < 0)
    return interaction.reply({ content: "Reminder must be >= 0.", ephemeral: true });

  const [hour, minute] = time.split(":").map(Number);
  const eventDate = new Date();
  eventDate.setMonth(month - 1, day);
  eventDate.setHours(hour, minute, 0, 0);

  if (eventDate.getTime() < Date.now())
    return interaction.reply({ content: "Event date is in the past.", ephemeral: true });

  // --- Zapis eventu ---
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

// --- List Events ---
async function showList(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  const guildId = interaction.guild.id;
  const events = getEvents(guildId);

  if (!events.length)
    return interaction.reply({ content: "No events found.", ephemeral: true });

  const formatted = events
    .map((e) => {
      let statusEmoji = e.status === "ACTIVE" ? "🟢" : e.status === "PAST" ? "🔴" : "⚪";
      return `• ${statusEmoji} **${e.name}** - <t:${Math.floor(
        new Date(e.year || new Date().getFullYear(), e.month - 1, e.day, e.hour, e.minute).getTime() / 1000
      )}:F>`;
    })
    .join("\n");

  await interaction.reply({ content: formatted, ephemeral: true });
}

// --- Cancel Event ---
async function showCancelMenu(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  const guildId = interaction.guild.id;
  const events = getEvents(guildId).filter((e) => e.status === "ACTIVE");

  if (!events.length)
    return interaction.reply({ content: "No active events.", ephemeral: true });

  const select = new StringSelectMenuBuilder()
    .setCustomId("cancel_select")
    .setPlaceholder("Select event to cancel")
    .addOptions(events.map((e) => ({ label: e.name, value: e.id })));

  await interaction.reply({
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
    ephemeral: true,
  });
}

// --- Select menu handler ---
async function handleSelect(interaction: StringSelectMenuInteraction) {
  if (!interaction.guild) return;
  const guildId = interaction.guild.id;

  if (interaction.customId === "cancel_select") {
    const id = interaction.values[0];
    const events = getEvents(guildId);
    const event = events.find((e) => e.id === id);
    if (event) {
      event.status = "CANCELLED";
      saveEvents(guildId, events);
    }
    return interaction.reply({ content: "Event cancelled.", ephemeral: true });
  }

  if (interaction.customId === "channel_select") {
    const channelId = interaction.values[0];
    setConfig(guildId, { defaultChannelId: channelId });
    return interaction.reply({ content: "Default channel updated.", ephemeral: true });
  }
}

// --- Channel select ---
async function showChannelSelect(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  const channels = interaction.guild.channels.cache
    .filter((c) => c.isTextBased())
    .map((c) => ({ label: c.name, value: c.id }));

  const select = new StringSelectMenuBuilder()
    .setCustomId("channel_select")
    .setPlaceholder("Select notification channel")
    .addOptions(channels);

  await interaction.reply({
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
    ephemeral: true,
  });
}

// --- Manual Reminder ---
async function manualReminder(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  const guildId = interaction.guild.id;
  const config = getConfig(guildId);

  if (!config.defaultChannelId)
    return interaction.reply({ content: "No default channel set.", ephemeral: true });

  const channel = interaction.guild.channels.cache.get(config.defaultChannelId) as TextChannel;
  if (!channel) return interaction.reply({ content: "Channel not found.", ephemeral: true });

  const events = getEvents(guildId).filter((e) => e.status === "ACTIVE");

  for (const event of events) {
    await channel.send(`Reminder: **${event.name}** at <t:${Math.floor(
      new Date(event.year || new Date().getFullYear(), event.month - 1, event.day, event.hour, event.minute).getTime() / 1000
    )}:F>`);
  }

  await interaction.reply({ content: "Reminders sent.", ephemeral: true });
}

// --- Download Participants ---
async function downloadParticipants(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  const guildId = interaction.guild.id;
  const events = getEvents(guildId).filter((e) => e.status === "PAST");

  if (!events.length)
    return interaction.reply({ content: "No past events.", ephemeral: true });

  const select = new StringSelectMenuBuilder()
    .setCustomId("download_select")
    .setPlaceholder("Select past event")
    .addOptions(events.map((e) => ({ label: e.name, value: e.id })));

  await interaction.reply({
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
    ephemeral: true,
  });
}

// --- Help ---
async function showHelp(interaction: ButtonInteraction) {
  const helpText = `
**Event Panel Help**
• Create Event – create_event
• List Events – list_events
• ⚙️ Settings – event_settings
• 🔔 Manual Reminder – event_manual_reminder
• 🗑️ Cancel Event – event_cancel
• ⬇️ Download Participants – event_download
`;

  await interaction.reply({ content: helpText, ephemeral: true });
}