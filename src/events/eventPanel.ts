import fs from 'fs';
import path from 'path';
import {
  Client,
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
  Colors,
} from 'discord.js';

const eventsFile = path.join(__dirname, '../data/events.json');

interface Event {
  id: string;
  name: string;
  day: number;
  month: number;
  time: string; // HH:MM
  channelId?: string;
  reminderMinutes?: number;
  participants: string[];
}

let events: Event[] = [];

export function loadEvents() {
  if (fs.existsSync(eventsFile)) {
    events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
  } else {
    events = [];
  }
}

export function saveEvents() {
  fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
}

export async function handleEventButton(client: Client, interaction: Interaction) {
  if (!interaction.isButton()) return;

  // Tworzenie eventu
  if (interaction.customId === 'create_event') {
    const modal = new ModalBuilder()
      .setCustomId('modal_create_event')
      .setTitle('Create Event');

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('event_name')
          .setLabel('Event Name')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('event_day')
          .setLabel('Day')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('event_month')
          .setLabel('Month')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('event_time')
          .setLabel('Time (HH:MM)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return;
  }

  // Obsługa dzwoneczka, kosza i śrubki
  if (interaction.customId.startsWith('active_event_')) {
    const [prefix, eventId, action] = interaction.customId.split('_');

    const ev = events.find(e => e.id === eventId);
    if (!ev) {
      await interaction.reply({ content: 'Event not found.', ephemeral: true });
      return;
    }

    switch (action) {
      case 'bell':
        // Wyślij przypomnienie do kanału eventu
        if (ev.channelId) {
          const channel = interaction.guild?.channels.cache.get(ev.channelId as string);
          if (channel && 'send' in channel) {
            await (channel as any).send(`Reminder: ${ev.name} starts at ${ev.time}`);
          }
        }
        await interaction.reply({ content: 'Reminder sent.', ephemeral: true });
        break;

      case 'trash':
        events = events.filter(e => e.id !== eventId);
        saveEvents();
        await interaction.reply({ content: 'Event deleted.', ephemeral: true });
        break;

      case 'gear':
        // Śrubka: wybór kanału i przypomnienia automatycznego
        const channelSelect = new StringSelectMenuBuilder()
          .setCustomId(`select_channel_${eventId}`)
          .setPlaceholder('Select channel for notifications')
          .addOptions(
            interaction.guild?.channels.cache
              .filter(c => c.isTextBased())
              .map(c => ({ label: c.name, value: c.id })) || []
          );

        const reminderSelect = new StringSelectMenuBuilder()
          .setCustomId(`select_reminder_${eventId}`)
          .setPlaceholder('Select reminder minutes')
          .addOptions(
            Array.from({ length: 12 }, (_, i) => (i + 1) * 5).map(min => ({
              label: `${min} minutes before`,
              value: min.toString(),
            }))
          );

        await interaction.reply({
          content: 'Configure event:',
          components: [
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(channelSelect),
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(reminderSelect),
          ],
          ephemeral: true,
        });
        break;
    }
    return;
  }

  // Minione eventy: tylko pobranie listy uczestników
  if (interaction.customId.startsWith('past_event_')) {
    const [prefix, eventId] = interaction.customId.split('_');
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    await interaction.reply({
      content: `Participants for ${ev.name}:\n${ev.participants.join('\n')}`,
      ephemeral: true,
    });
  }
}

export async function handleModalSubmit(interaction: any) {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === 'modal_create_event') {
    const name = interaction.fields.getTextInputValue('event_name');
    const day = parseInt(interaction.fields.getTextInputValue('event_day'));
    const month = parseInt(interaction.fields.getTextInputValue('event_month'));
    const time = interaction.fields.getTextInputValue('event_time');

    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newEvent: Event = { id, name, day, month, time, participants: [] };
    events.push(newEvent);
    saveEvents();

    await interaction.reply({ content: `Event ${name} created.`, ephemeral: true });
  }
}