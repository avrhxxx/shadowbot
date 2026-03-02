import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SelectMenuBuilder,
  Interaction,
  ButtonInteraction,
  ModalSubmitInteraction,
  TextChannel,
  ChannelType
} from 'discord.js';
import fs from 'fs';
import path from 'path';

const EVENTS_FILE = path.join(__dirname, '../data/events.json');
let events: any[] = [];
let defaultNotifyChannelId: string | null = null;

// Wczytaj eventy przy starcie
if (fs.existsSync(EVENTS_FILE)) {
  events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
} else {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify([]));
}

function saveEvents() {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

// Tworzymy modal do utworzenia eventu
function createEventModal() {
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
        .setLabel('Hour:Minute (24h)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('event_reminder')
        .setLabel('Reminder minutes before event')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
    )
  );

  return modal;
}

// Generuje główny panel z przyciskami
function createMainPanel() {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_create_event')
        .setLabel('Create Event')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('btn_manual_reminder')
        .setLabel('🔔 Manual Reminder')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('btn_delete_event')
        .setLabel('🗑️ Delete Active Event')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('btn_default_channel')
        .setLabel('⚙️ Set Notify Channel')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('btn_download_list')
        .setLabel('⬇️ Download Participants')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

// Obsługa przycisków
async function handleButton(interaction: ButtonInteraction) {
  switch (interaction.customId) {
    case 'btn_create_event':
      await interaction.showModal(createEventModal());
      break;

    case 'btn_manual_reminder':
      // Wyświetl listę aktywnych eventów i pozwól wywołać przypomnienie
      await interaction.reply({
        content: 'Manual reminder triggered for active events (placeholder)',
        ephemeral: true
      });
      break;

    case 'btn_delete_event':
      // Wyświetl listę aktywnych eventów do usunięcia
      await interaction.reply({
        content: 'Choose event to delete (placeholder)',
        ephemeral: true
      });
      break;

    case 'btn_default_channel':
      if (!interaction.guild) return;
      // Tworzymy select menu dla wszystkich kanałów tekstowych w serwerze
      const channels = interaction.guild.channels.cache
        .filter(c => c.type === ChannelType.GuildText)
        .map(c => ({ label: c.name, value: c.id }));

      const selectMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId('select_notify_channel')
          .setPlaceholder('Choose default notify channel')
          .addOptions(channels)
      );

      await interaction.reply({ content: 'Select default notify channel:', components: [selectMenu], ephemeral: true });
      break;

    case 'btn_download_list':
      await interaction.reply({
        content: 'Download participants for past events (placeholder)',
        ephemeral: true
      });
      break;
  }
}

// Obsługa select menu
async function handleSelectMenu(interaction: Interaction) {
  if (!interaction.isSelectMenu()) return;

  if (interaction.customId === 'select_notify_channel') {
    defaultNotifyChannelId = interaction.values[0];
    await interaction.reply({ content: `Default notification channel set!`, ephemeral: true });
  }
}

// Obsługa submitu modala
async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  if (interaction.customId !== 'modal_create_event') return;

  const name = interaction.fields.getTextInputValue('event_name');
  const day = interaction.fields.getTextInputValue('event_day');
  const month = interaction.fields.getTextInputValue('event_month');
  const time = interaction.fields.getTextInputValue('event_time');
  const reminder = interaction.fields.getTextInputValue('event_reminder');

  const newEvent = { name, day, month, time, reminder, createdAt: Date.now() };
  events.push(newEvent);
  saveEvents();

  await interaction.reply({ content: `Event "${name}" created!`, ephemeral: true });
}

// Inicjalizacja event panel w kliencie
export function initEventPanel(client: Client) {
  client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
      await handleButton(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    } else if (interaction.isSelectMenu()) {
      await handleSelectMenu(interaction);
    }
  });
}