import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  ButtonInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  Interaction,
  CacheType,
} from 'discord.js';
import fs from 'fs';
import path from 'path';

interface EventData {
  id: string;
  guildId: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  channelId?: string;
  reminderMinutes?: number;
  participants?: string[];
}

const EVENTS_FILE = path.join(__dirname, '../data/events.json');
let events: EventData[] = [];

function loadEvents() {
  if (!fs.existsSync(EVENTS_FILE)) return;
  events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
}

function saveEvents() {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

function isPastEvent(ev: EventData) {
  const now = new Date();
  const evDate = new Date(now.getFullYear(), ev.month - 1, ev.day, ev.hour, ev.minute);
  return evDate.getTime() < now.getTime();
}

export const showCreateEventModal = async (interaction: Interaction) => {
  if (!interaction.isButton()) return;

  const modal = new ModalBuilder()
    .setCustomId('modal_create_event')
    .setTitle('Create Event');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId('event_name').setLabel('Event Name').setStyle(TextInputStyle.Short)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId('event_day').setLabel('Day').setStyle(TextInputStyle.Short)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId('event_month').setLabel('Month').setStyle(TextInputStyle.Short)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId('event_time').setLabel('Time (HH:MM)').setStyle(TextInputStyle.Short)
    )
  );

  await interaction.showModal(modal);
};

export const handleModalSubmit = async (interaction: ModalSubmitInteraction<CacheType>) => {
  if (interaction.customId !== 'modal_create_event') return;

  const name = interaction.fields.getTextInputValue('event_name');
  const day = parseInt(interaction.fields.getTextInputValue('event_day'));
  const month = parseInt(interaction.fields.getTextInputValue('event_month'));
  const [hourStr, minuteStr] = interaction.fields.getTextInputValue('event_time').split(':');
  const hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

  loadEvents();
  const guildId = interaction.guildId;
  if (!guildId) return;

  const duplicate = events.find(ev => ev.guildId === guildId && ev.name === name);
  if (duplicate) {
    await interaction.reply({ content: '❌ Event with this name already exists.', ephemeral: true });
    return;
  }

  const newEvent: EventData = {
    id: Date.now().toString(),
    guildId,
    name,
    day,
    month,
    hour,
    minute,
    participants: [],
  };

  events.push(newEvent);
  saveEvents();

  await interaction.reply({ content: '✅ Event created! Configure channel and reminders in ⚙️.', ephemeral: true });
};

export const showEventList = async (interaction: Interaction) => {
  loadEvents();
  if (!interaction.guildId) return;

  const guildEvents = events.filter(ev => ev.guildId === interaction.guildId);
  if (guildEvents.length === 0) {
    if ('reply' in interaction) await interaction.reply({ content: 'No events found.', ephemeral: true });
    return;
  }

  for (const ev of guildEvents) {
    const past = isPastEvent(ev);

    const row = new ActionRowBuilder<ButtonBuilder>();
    if (!past) {
      row.addComponents(
        new ButtonBuilder().setCustomId(`reminder_${ev.id}`).setLabel('🔔 Reminder').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`delete_${ev.id}`).setLabel('🗑️ Delete').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`config_${ev.id}`).setLabel('⚙️ Configure').setStyle(ButtonStyle.Secondary)
      );
    } else {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`download_${ev.id}`)
          .setLabel('📥 Download Participants')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    if (interaction.channel?.isTextBased()) {
      await interaction.channel.send({
        content: `Event: **${ev.name}**\nDate: ${ev.day}/${ev.month} ${ev.hour}:${ev.minute
          .toString()
          .padStart(2, '0')}`,
        components: [row],
      });
    }
  }
};

export const handleButton = async (interaction: ButtonInteraction<CacheType>) => {
  const [action, id] = interaction.customId.split('_');
  loadEvents();
  const ev = events.find(e => e.id === id);
  if (!ev) {
    await interaction.reply({ content: 'Event not found.', ephemeral: true });
    return;
  }

  switch (action) {
    case 'delete':
      events = events.filter(e => e.id !== id);
      saveEvents();
      await interaction.reply({ content: '✅ Event deleted.', ephemeral: true });
      break;
    case 'reminder':
      await interaction.reply({ content: '🔔 Reminder sent!', ephemeral: true });
      break;
    case 'config':
      if (!interaction.guild) return;
      const channels = interaction.guild.channels.cache
        .filter(c => c.type === ChannelType.GuildText)
        .map(c => ({ label: c.name, value: c.id }));
      const select = new StringSelectMenuBuilder()
        .setCustomId(`config_select_${ev.id}`)
        .setPlaceholder('Select notification channel')
        .addOptions(channels);
      await interaction.reply({ content: 'Select channel for notifications:', components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)], ephemeral: true });
      break;
    case 'download':
      const participants = ev.participants?.join(', ') || 'No participants';
      if (interaction.channel?.isTextBased())
        await interaction.channel.send(`Participants for **${ev.name}**:\n${participants}`);
      await interaction.reply({ content: '✅ List sent.', ephemeral: true });
      break;
  }
};

export const handleSelectMenu = async (interaction: StringSelectMenuInteraction<CacheType>) => {
  if (!interaction.customId.startsWith('config_select_')) return;
  const id = interaction.customId.replace('config_select_', '');
  loadEvents();
  const ev = events.find(e => e.id === id);
  if (!ev) {
    await interaction.reply({ content: 'Event not found.', ephemeral: true });
    return;
  }

  ev.channelId = interaction.values[0];
  saveEvents();
  await interaction.reply({ content: `✅ Notification channel set to <#${ev.channelId}>`, ephemeral: true });
};