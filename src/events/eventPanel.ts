import fs from 'fs';
import path from 'path';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SelectMenuBuilder,
  SelectMenuOptionBuilder,
  Interaction,
  ModalSubmitInteraction,
  ButtonInteraction,
  GuildTextBasedChannel
} from 'discord.js';

interface EventData {
  id: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  guildId: string;
  channelId?: string;
  reminderMinutes?: number;
  participants: string[];
}

const eventsFile = path.join(__dirname, '../data/events.json');
let events: EventData[] = [];

// --- Helpers ---
const loadEvents = () => {
  if (fs.existsSync(eventsFile)) {
    events = JSON.parse(fs.readFileSync(eventsFile, 'utf-8'));
  } else {
    events = [];
  }
};

const saveEvents = () => {
  fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
};

const isPastEvent = (event: EventData) => {
  const now = new Date();
  const evDate = new Date();
  evDate.setDate(event.day);
  evDate.setMonth(event.month - 1);
  evDate.setHours(event.hour, event.minute, 0, 0);
  return evDate.getTime() < now.getTime();
};

// --- Create Event Modal ---
export const showCreateEventModal = async (interaction: ButtonInteraction) => {
  const modal = new ModalBuilder()
    .setCustomId('modal_create_event')
    .setTitle('Create Event');

  const nameInput = new TextInputBuilder()
    .setCustomId('event_name')
    .setLabel('Event Name')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const dayInput = new TextInputBuilder()
    .setCustomId('event_day')
    .setLabel('Day')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const monthInput = new TextInputBuilder()
    .setCustomId('event_month')
    .setLabel('Month')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const timeInput = new TextInputBuilder()
    .setCustomId('event_time')
    .setLabel('Time (HH:MM)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput)
  );

  await interaction.showModal(modal);
};

// --- Handle Modal Submit ---
export const handleModalSubmit = async (interaction: ModalSubmitInteraction) => {
  const name = interaction.fields.getTextInputValue('event_name');
  const day = parseInt(interaction.fields.getTextInputValue('event_day'));
  const month = parseInt(interaction.fields.getTextInputValue('event_month'));
  const [hour, minute] = interaction.fields.getTextInputValue('event_time').split(':').map(Number);

  const newEvent: EventData = {
    id: `${Date.now()}`,
    name,
    day,
    month,
    hour,
    minute,
    guildId: interaction.guildId!,
    participants: []
  };

  events.push(newEvent);
  saveEvents();

  await interaction.reply({ content: `Event "${name}" created! Configure notifications via ⚙️`, ephemeral: true });
};

// --- Show Event List ---
export const showEventList = async (interaction: Interaction) => {
  loadEvents();

  const guildEvents = events.filter(ev => ev.guildId === interaction.guildId);
  if (guildEvents.length === 0) {
    await interaction.reply({ content: 'No events found.', ephemeral: true });
    return;
  }

  for (const ev of guildEvents) {
    const past = isPastEvent(ev);

    const row = new ActionRowBuilder<ButtonBuilder>();

    if (!past) {
      // Active: show bell and trash
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`reminder_${ev.id}`)
          .setLabel('🔔 Reminder')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`delete_${ev.id}`)
          .setLabel('🗑️ Delete')
          .setStyle(ButtonStyle.Danger)
      );
      // Gear for notification setup
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`config_${ev.id}`)
          .setLabel('⚙️ Configure')
          .setStyle(ButtonStyle.Secondary)
      );
    } else {
      // Past: download participants
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`download_${ev.id}`)
          .setLabel('📥 Download Participants')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    await interaction.channel?.send({
      content: `Event: **${ev.name}**\nDate: ${ev.day}/${ev.month} ${ev.hour}:${ev.minute.toString().padStart(2,'0')}`,
      components: [row]
    });
  }
};

// --- Handle Buttons ---
export const handleButton = async (interaction: ButtonInteraction) => {
  const [action, eventId] = interaction.customId.split('_');
  const ev = events.find(e => e.id === eventId);
  if (!ev) {
    await interaction.reply({ content: 'Event not found.', ephemeral: true });
    return;
  }

  switch(action) {
    case 'delete':
      events = events.filter(e => e.id !== eventId);
      saveEvents();
      await interaction.reply({ content: `Event "${ev.name}" deleted.`, ephemeral: true });
      break;
    case 'reminder':
      // Manual reminder logic here
      await interaction.reply({ content: `Manual reminder sent for "${ev.name}".`, ephemeral: true });
      break;
    case 'config':
      // Show select menus: channel and auto-reminder
      const channelOptions = interaction.guild?.channels.cache
        .filter(c => c.isTextBased())
        .map(c => new SelectMenuOptionBuilder().setLabel(c.name).setValue(c.id)) || [];

      const reminderOptions = Array.from({length:12},(_,i)=> (i+1)*5).map(min =>
        new SelectMenuOptionBuilder().setLabel(`${min} min before`).setValue(`${min}`)
      );

      const channelMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId(`setChannel_${ev.id}`)
          .addOptions(channelOptions)
          .setPlaceholder('Select notification channel')
      );

      const reminderMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId(`setReminder_${ev.id}`)
          .addOptions(reminderOptions)
          .setPlaceholder('Select auto reminder')
      );

      await interaction.reply({ content: 'Configure notification:', components: [channelMenu, reminderMenu], ephemeral: true });
      break;
    case 'download':
      await interaction.reply({ content: `Participants for "${ev.name}":\n${ev.participants.join('\n') || 'None'}`, ephemeral: true });
      break;
  }
};

// --- Handle Select Menu ---
export const handleSelectMenu = async (interaction: Interaction) => {
  if (!interaction.isSelectMenu()) return;

  const [action, eventId] = interaction.customId.split('_');
  const ev = events.find(e => e.id === eventId);
  if (!ev) {
    await interaction.reply({ content: 'Event not found.', ephemeral: true });
    return;
  }

  switch(action) {
    case 'setChannel':
      ev.channelId = interaction.values[0];
      saveEvents();
      await interaction.reply({ content: `Notification channel set.`, ephemeral: true });
      break;
    case 'setReminder':
      ev.reminderMinutes = parseInt(interaction.values[0]);
      saveEvents();
      await interaction.reply({ content: `Auto reminder set to ${ev.reminderMinutes} minutes before.`, ephemeral: true });
      break;
  }
};