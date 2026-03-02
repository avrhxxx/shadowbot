import {
  Client,
  Interaction,
  ButtonInteraction,
  ModalSubmitInteraction,
  TextChannel,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  Modal,
  TextInputComponent,
  TextInputStyle,
  CacheType,
  Guild
} from 'discord.js';
import fs from 'fs';
import path from 'path';

type EventData = {
  id: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  reminderMinutes: number;
  active: boolean;
  participants: string[];
};

const eventsFile = path.join(__dirname, '../data/events.json');
let events: EventData[] = [];

function loadEvents() {
  if (fs.existsSync(eventsFile)) {
    events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
  }
}

function saveEvents() {
  fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
}

export function initEventPanel(client: Client) {
  loadEvents();

  client.on('interactionCreate', async (interaction: Interaction<CacheType>) => {
    if (interaction.isButton()) await handleButton(interaction);
    if (interaction.isModalSubmit()) await handleModal(interaction);
    if (interaction.isSelectMenu()) await handleSelectMenu(interaction);
  });
}

async function handleButton(interaction: ButtonInteraction) {
  switch (interaction.customId) {
    case 'create_event':
      await showCreateEventModal(interaction);
      break;
    case 'list_events':
      await showEventList(interaction);
      break;
    case 'settings_channel':
      await showChannelSelectMenu(interaction);
      break;
    case 'manual_reminder':
      await triggerManualReminder(interaction);
      break;
    case 'cancel_event':
      await showCancellableEvents(interaction);
      break;
    case 'download_list':
      await downloadPastEventParticipants(interaction);
      break;
    case 'help':
      await showHelp(interaction);
      break;
  }
}

// --- Modal do tworzenia eventu ---
async function showCreateEventModal(interaction: ButtonInteraction) {
  const modal = new Modal()
    .setCustomId('modal_create_event')
    .setTitle('Create Event');

  const nameInput = new TextInputComponent()
    .setCustomId('event_name')
    .setLabel('Event Name')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const dayInput = new TextInputComponent()
    .setCustomId('event_day')
    .setLabel('Day (1-31)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const monthInput = new TextInputComponent()
    .setCustomId('event_month')
    .setLabel('Month (1-12)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const timeInput = new TextInputComponent()
    .setCustomId('event_time')
    .setLabel('Time (HH:MM)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const reminderInput = new TextInputComponent()
    .setCustomId('reminder_minutes')
    .setLabel('Minutes before event for auto reminder')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new MessageActionRow<TextInputComponent>().addComponents(nameInput),
    new MessageActionRow<TextInputComponent>().addComponents(dayInput),
    new MessageActionRow<TextInputComponent>().addComponents(monthInput),
    new MessageActionRow<TextInputComponent>().addComponents(timeInput),
    new MessageActionRow<TextInputComponent>().addComponents(reminderInput)
  );

  await interaction.showModal(modal);
}

// --- Obsługa submitu modala ---
async function handleModal(interaction: ModalSubmitInteraction) {
  if (interaction.customId !== 'modal_create_event') return;

  const name = interaction.fields.getTextInputValue('event_name');
  const day = parseInt(interaction.fields.getTextInputValue('event_day'));
  const month = parseInt(interaction.fields.getTextInputValue('event_month'));
  const [hour, minute] = interaction.fields
    .getTextInputValue('event_time')
    .split(':')
    .map(Number);
  const reminderMinutes = parseInt(
    interaction.fields.getTextInputValue('reminder_minutes') || '0'
  );

  const id = Date.now().toString();
  const newEvent: EventData = {
    id,
    name,
    day,
    month,
    hour,
    minute,
    reminderMinutes,
    active: true,
    participants: []
  };

  events.push(newEvent);
  saveEvents();

  await interaction.reply({
    content: `Event **${name}** created successfully!`,
    ephemeral: true
  });
}

// --- Listowanie eventów ---
async function showEventList(interaction: ButtonInteraction) {
  loadEvents();

  if (!events.length) {
    await interaction.reply({ content: 'No events found.', ephemeral: true });
    return;
  }

  const components: MessageActionRow<MessageButton>[] = [];

  for (const ev of events) {
    const color = ev.active ? 'SUCCESS' : 'DANGER';
    components.push(
      new MessageActionRow<MessageButton>().addComponents(
        new MessageButton()
          .setCustomId(`view_event_${ev.id}`)
          .setLabel(`${ev.name} (${ev.day}/${ev.month} ${ev.hour}:${ev.minute})`)
          .setStyle(color)
      )
    );
  }

  await interaction.reply({
    content: 'Event List:',
    components: components,
    ephemeral: true
  });
}

// --- Select Menu ustawienia kanału ---
async function showChannelSelectMenu(interaction: ButtonInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  const channels = guild.channels.cache
    .filter(c => c.isTextBased())
    .map(c => ({
      label: c.name,
      value: c.id
    }));

  const menu = new MessageSelectMenu()
    .setCustomId('select_default_channel')
    .setPlaceholder('Select default notification channel')
    .addOptions(channels);

  const row = new MessageActionRow<MessageSelectMenu>().addComponents(menu);

  await interaction.reply({ content: 'Select default channel:', components: [row], ephemeral: true });
}

// --- Pozostałe przyciski (szkielet funkcji) ---
async function triggerManualReminder(interaction: ButtonInteraction) {
  await interaction.reply({ content: 'Manual reminder triggered.', ephemeral: true });
}

async function showCancellableEvents(interaction: ButtonInteraction) {
  await interaction.reply({ content: 'List of cancellable events.', ephemeral: true });
}

async function downloadPastEventParticipants(interaction: ButtonInteraction) {
  await interaction.reply({ content: 'Downloading participant lists...', ephemeral: true });
}

async function showHelp(interaction: ButtonInteraction) {
  const helpText = `
**Help:**
⚙️ - Set default notification channel
🔔 - Trigger manual reminder
🗑️ - Cancel active event
⬇️ - Download past event participants
  `;
  await interaction.reply({ content: helpText, ephemeral: true });
}

// --- Select Menu handler ---
async function handleSelectMenu(interaction: any) {
  if (interaction.customId === 'select_default_channel') {
    const selectedChannel = interaction.values[0];
    // tutaj zapisujemy wybrany kanał jako domyślny dla wszystkich eventów
    // np. w config.json lub w memory
    await interaction.reply({ content: `Default channel set!`, ephemeral: true });
  }
}