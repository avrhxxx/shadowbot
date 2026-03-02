import {
  Client,
  Interaction,
  ModalSubmitInteraction,
  TextChannel,
  SelectMenuInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SelectMenuBuilder,
  TextBasedChannel,
  Guild
} from "discord.js";
import fs from "fs";
import path from "path";

interface EventData {
  id: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  reminderMinutes?: number;
  isActive: boolean;
  participants: string[];
}

const DATA_PATH = path.join(__dirname, "../data/events.json");
let events: EventData[] = [];

// Load events from file
try {
  if (fs.existsSync(DATA_PATH)) {
    events = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  }
} catch (err) {
  console.error("Failed to load events:", err);
}

// Save events to file
const saveEvents = () => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2));
};

// Utility: fetch channel safely
const fetchTextChannel = async (client: Client, channelId: string): Promise<TextBasedChannel | null> => {
  const channel = await client.channels.fetch(channelId);
  return channel && "send" in channel ? (channel as TextBasedChannel) : null;
};

// Handle main panel buttons
export const handleEventButton = async (client: Client, interaction: Interaction) => {
  if (!interaction.isButton()) return;

  const id = interaction.customId;

  switch (id) {
    case "create_event":
      await interaction.showModal(createEventModal());
      break;

    case "manual_reminder":
      await showActiveEventsReminder(interaction, client);
      break;

    case "cancel_event":
      await showCancelableEvents(interaction, client);
      break;

    case "download_participants":
      await showDownloadEvents(interaction, client);
      break;

    case "set_notify_channel":
      await showNotifyChannelSelect(interaction);
      break;

    default:
      await interaction.reply({ content: "Unknown action.", ephemeral: true });
  }
};

// Create event modal
const createEventModal = () =>
  new ModalSubmitInteraction()
    .setCustomId("modal_create_event")
    .setTitle("Create Event");

// Handle modal submit
export const handleEventModalSubmit = async (interaction: ModalSubmitInteraction) => {
  if (interaction.customId !== "modal_create_event") return;

  const name = interaction.fields.getTextInputValue("name");
  const day = parseInt(interaction.fields.getTextInputValue("day"));
  const month = parseInt(interaction.fields.getTextInputValue("month"));
  const hour = parseInt(interaction.fields.getTextInputValue("hour"));
  const minute = parseInt(interaction.fields.getTextInputValue("minute"));
  const reminder = parseInt(interaction.fields.getTextInputValue("reminderMinutes"));

  const newEvent: EventData = {
    id: Date.now().toString(),
    name,
    day,
    month,
    hour,
    minute,
    reminderMinutes: reminder,
    isActive: true,
    participants: []
  };

  events.push(newEvent);
  saveEvents();

  await interaction.reply({ content: `✅ Event "${name}" created!`, ephemeral: true });
};

// --- Example helpers for other buttons ---

const showActiveEventsReminder = async (interaction: Interaction, client: Client) => {
  const activeEvents = events.filter(e => e.isActive);
  if (activeEvents.length === 0)
    return interaction.reply({ content: "No active events.", ephemeral: true });

  const rows = activeEvents.map(e =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`remind_${e.id}`)
        .setLabel(`🔔 ${e.name}`)
        .setStyle(ButtonStyle.Primary)
    )
  );

  await interaction.reply({ content: "Select event to send reminder:", components: rows, ephemeral: true });
};

const showCancelableEvents = async (interaction: Interaction, client: Client) => {
  const activeEvents = events.filter(e => e.isActive);
  if (activeEvents.length === 0)
    return interaction.reply({ content: "No events to cancel.", ephemeral: true });

  const rows = activeEvents.map(e =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`cancel_${e.id}`)
        .setLabel(`🗑 ${e.name}`)
        .setStyle(ButtonStyle.Danger)
    )
  );

  await interaction.reply({ content: "Select event to cancel:", components: rows, ephemeral: true });
};

const showDownloadEvents = async (interaction: Interaction, client: Client) => {
  if (events.length === 0)
    return interaction.reply({ content: "No events available.", ephemeral: true });

  const rows = events.map(e =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`download_${e.id}`)
        .setLabel(`⬇ ${e.name}`)
        .setStyle(ButtonStyle.Secondary)
    )
  );

  await interaction.reply({ content: "Select event to download participants:", components: rows, ephemeral: true });
};

const showNotifyChannelSelect = async (interaction: Interaction) => {
  const row = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
    new SelectMenuBuilder()
      .setCustomId("select_notify_channel")
      .setPlaceholder("Select channel for notifications")
      .addOptions([
        { label: "General", value: "general" },
        { label: "Events", value: "events" },
        { label: "Random", value: "random" }
      ])
  );

  await interaction.reply({ content: "Choose notify channel:", components: [row], ephemeral: true });
};