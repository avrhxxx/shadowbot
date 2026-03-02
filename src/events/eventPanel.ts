import { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, SelectMenuBuilder, ComponentType } from 'discord.js';
import fs from 'fs';
import path from 'path';

interface EventData {
    name: string;
    day: number;
    month: number;
    hour: number;
    minute: number;
    channelId?: string;
    reminderMinutes?: number;
    participants: string[];
    createdAt: number;
}

const EVENTS_FILE = path.join(__dirname, '../data/events.json');

let events: EventData[] = [];

// Load events on startup
if (fs.existsSync(EVENTS_FILE)) {
    try {
        events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
    } catch (err) {
        console.error('Error reading events.json:', err);
        events = [];
    }
}

function saveEvents() {
    try {
        fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
    } catch (err) {
        console.error('Error saving events.json:', err);
    }
}

export function registerEventPanel(client: Client) {
    client.on('interactionCreate', async interaction => {
        if (interaction.isButton()) {
            const { customId } = interaction;

            // === BUTTON: OPEN EVENT PANEL ===
            if (customId === 'open_event_panel') {
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_event')
                        .setLabel('Create Event')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('list_events')
                        .setLabel('List Events')
                        .setStyle(ButtonStyle.Secondary)
                );
                await interaction.reply({ content: '📌 Event Panel\nSelect an action:', components: [row], ephemeral: true });
            }

            // === BUTTON: CREATE EVENT ===
            if (customId === 'create_event') {
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
                    .setLabel('Time (HH:MM, 24h)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                // Five-field limit for Discord modal
                modal.addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput)
                );

                await interaction.showModal(modal);
            }

            // === BUTTON: LIST EVENTS ===
            if (customId === 'list_events') {
                await sendEventList(interaction);
            }
        }

        // === MODAL SUBMIT ===
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_create_event') {
                const name = interaction.fields.getTextInputValue('event_name').trim();
                const day = parseInt(interaction.fields.getTextInputValue('event_day'));
                const month = parseInt(interaction.fields.getTextInputValue('event_month'));
                const [hour, minute] = interaction.fields.getTextInputValue('event_time').split(':').map(v => parseInt(v));

                if (events.find(e => e.name.toLowerCase() === name.toLowerCase())) {
                    await interaction.reply({ content: '❌ Event name already exists.', ephemeral: true });
                    return;
                }

                const newEvent: EventData = {
                    name,
                    day,
                    month,
                    hour,
                    minute,
                    participants: [],
                    createdAt: Date.now()
                };

                events.push(newEvent);
                saveEvents();

                await interaction.reply({ content: `✅ Event "${name}" created! Now set channel & reminders using ⚙️ button.`, ephemeral: true });
            }
        }

        // === BUTTON: EVENT ACTIONS (⚙️, 🔔, 🗑️, ⬇️) ===
        if (interaction.isButton()) {
            const [action, eventName] = interaction.customId.split('|');
            const event = events.find(e => e.name === eventName);
            if (!event) {
                await interaction.reply({ content: 'Event not found.', ephemeral: true });
                return;
            }

            // SETTINGS ⚙️
            if (action === 'settings') {
                // Select channel
                const channelSelect = new SelectMenuBuilder()
                    .setCustomId(`channel|${event.name}`)
                    .setPlaceholder('Select channel for notifications')
                    .addOptions(interaction.guild.channels.cache
                        .filter(c => c.isTextBased())
                        .map(c => ({ label: c.name, value: c.id })));

                // Select reminder minutes
                const reminderSelect = new SelectMenuBuilder()
                    .setCustomId(`reminder|${event.name}`)
                    .setPlaceholder('Select reminder minutes')
                    .addOptions(
                        Array.from({ length: 12 }, (_, i) => (i + 1) * 5).map(min => ({ label: `${min} min before`, value: min.toString() }))
                    );

                await interaction.reply({ content: `Set settings for "${event.name}":`, components: [new ActionRowBuilder<SelectMenuBuilder>().addComponents(channelSelect), new ActionRowBuilder<SelectMenuBuilder>().addComponents(reminderSelect)], ephemeral: true });
            }

            // MANUAL REMINDER 🔔
            if (action === 'notify') {
                const channel = interaction.guild.channels.cache.get(event.channelId!)!;
                if (channel && channel.isTextBased()) {
                    await channel.send(`🔔 Reminder: Event "${event.name}" starts at ${event.hour}:${event.minute.toString().padStart(2, '0')}`);
                    await interaction.reply({ content: 'Notification sent.', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'No channel set for event.', ephemeral: true });
                }
            }

            // DELETE EVENT 🗑️
            if (action === 'delete') {
                events = events.filter(e => e.name !== event.name);
                saveEvents();
                await interaction.reply({ content: `Event "${event.name}" deleted.`, ephemeral: true });
            }

            // DOWNLOAD PARTICIPANTS ⬇️
            if (action === 'download') {
                if (event.participants.length === 0) {
                    await interaction.reply({ content: 'No participants to download.', ephemeral: true });
                } else {
                    await interaction.reply({ content: `Participants for "${event.name}":\n${event.participants.join('\n')}`, ephemeral: true });
                }
            }
        }

        // === SELECT MENU HANDLERS ===
        if (interaction.isStringSelectMenu()) {
            const [type, eventName] = interaction.customId.split('|');
            const event = events.find(e => e.name === eventName);
            if (!event) return;

            if (type === 'channel') {
                event.channelId = interaction.values[0];
                saveEvents();
                await interaction.reply({ content: `Channel set for "${event.name}".`, ephemeral: true });
            }

            if (type === 'reminder') {
                event.reminderMinutes = parseInt(interaction.values[0]);
                saveEvents();
                await interaction.reply({ content: `Reminder set ${interaction.values[0]} minutes before "${event.name}".`, ephemeral: true });
            }
        }
    });
}

async function sendEventList(interaction: any) {
    if (events.length === 0) {
        await interaction.reply({ content: 'No events pending.', ephemeral: true });
        return;
    }

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];

    const now = new Date();

    events.forEach(event => {
        const eventDate = new Date(now.getFullYear(), event.month - 1, event.day, event.hour, event.minute);
        const isPast = eventDate.getTime() < Date.now();

        const row = new ActionRowBuilder<ButtonBuilder>();

        if (!isPast) {
            row.addComponents(
                new ButtonBuilder().setCustomId(`settings|${event.name}`).setLabel('⚙️').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`notify|${event.name}`).setLabel('🔔').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`delete|${event.name}`).setLabel('🗑️').setStyle(ButtonStyle.Danger)
            );
        } else {
            row.addComponents(
                new ButtonBuilder().setCustomId(`download|${event.name}`).setLabel('⬇️').setStyle(ButtonStyle.Primary)
            );
        }

        rows.push(row);
    });

    await interaction.reply({ content: '📋 Events List', components: rows, ephemeral: true });
}