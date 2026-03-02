import { ButtonInteraction, ModalSubmitInteraction, TextChannel, ChannelType } from 'discord.js';
import fs from 'fs';
import path from 'path';

interface EventData {
    id: string;
    name: string;
    day: number;
    month: number;
    hour: number;
    minute: number;
    channelId?: string;
    reminderMinutes?: number;
    participants: string[];
}

const eventsFilePath = path.join(__dirname, '../data/events.json');

let events: EventData[] = [];

// Load events from JSON
if (fs.existsSync(eventsFilePath)) {
    events = JSON.parse(fs.readFileSync(eventsFilePath, 'utf-8'));
}

function saveEvents() {
    fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2));
}

// Helper: check if event is past
function isPastEvent(ev: EventData) {
    const now = new Date();
    const eventDate = new Date(now.getFullYear(), ev.month - 1, ev.day, ev.hour, ev.minute);
    return eventDate < now;
}

// Main exported function
export async function handleEventButton(interaction: ButtonInteraction | ModalSubmitInteraction) {
    try {
        if (interaction.isButton()) {
            const [action, eventId] = interaction.customId.split('_');

            switch (action) {
                case 'create':
                    await interaction.showModal({
                        custom_id: 'modal_create_event',
                        title: 'Create Event',
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 4,
                                        custom_id: 'event_name',
                                        style: 1,
                                        label: 'Event Name',
                                        required: true
                                    },
                                    {
                                        type: 4,
                                        custom_id: 'event_day',
                                        style: 1,
                                        label: 'Day (1-31)',
                                        required: true
                                    },
                                    {
                                        type: 4,
                                        custom_id: 'event_month',
                                        style: 1,
                                        label: 'Month (1-12)',
                                        required: true
                                    },
                                    {
                                        type: 4,
                                        custom_id: 'event_time',
                                        style: 1,
                                        label: 'Hour:Minute (24h)',
                                        required: true
                                    }
                                ]
                            }
                        ]
                    });
                    break;

                case 'bell':
                    {
                        const ev = events.find(e => e.id === eventId);
                        if (!ev) {
                            await interaction.reply({ content: 'Event not found.', ephemeral: true });
                            return;
                        }
                        if (!ev.channelId) {
                            await interaction.reply({ content: 'Notification channel not set.', ephemeral: true });
                            return;
                        }
                        const channel = interaction.guild?.channels.cache.get(ev.channelId) as TextChannel;
                        if (channel && channel.send) {
                            await channel.send(`Reminder: Event "${ev.name}" is starting soon!`);
                            await interaction.reply({ content: 'Manual reminder sent.', ephemeral: true });
                        } else {
                            await interaction.reply({ content: 'Channel not accessible.', ephemeral: true });
                        }
                    }
                    break;

                case 'trash':
                    {
                        const evIndex = events.findIndex(e => e.id === eventId);
                        if (evIndex === -1) {
                            await interaction.reply({ content: 'Event not found.', ephemeral: true });
                            return;
                        }
                        events.splice(evIndex, 1);
                        saveEvents();
                        await interaction.reply({ content: 'Event deleted.', ephemeral: true });
                    }
                    break;

                case 'gear':
                    {
                        const ev = events.find(e => e.id === eventId);
                        if (!ev) {
                            await interaction.reply({ content: 'Event not found.', ephemeral: true });
                            return;
                        }
                        // Show select menus for channel and reminder
                        const options = interaction.guild?.channels.cache
                            .filter(ch => ch.type === ChannelType.GuildText)
                            .map(ch => ({ label: ch.name, value: ch.id })) || [];

                        await interaction.reply({
                            content: 'Configure event notifications:',
                            ephemeral: true,
                            components: [
                                {
                                    type: 1,
                                    components: [
                                        {
                                            type: 3, // Select Menu
                                            custom_id: `select_channel_${eventId}`,
                                            options: options,
                                            placeholder: 'Select notification channel'
                                        },
                                        {
                                            type: 3,
                                            custom_id: `select_reminder_${eventId}`,
                                            options: Array.from({ length: 12 }, (_, i) => {
                                                const minutes = (i + 1) * 5;
                                                return { label: `${minutes} min before`, value: `${minutes}` };
                                            }),
                                            placeholder: 'Select reminder time'
                                        }
                                    ]
                                }
                            ]
                        });
                    }
                    break;
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_create_event') {
                const name = interaction.fields.getTextInputValue('event_name');
                const day = parseInt(interaction.fields.getTextInputValue('event_day'));
                const month = parseInt(interaction.fields.getTextInputValue('event_month'));
                const [hourStr, minuteStr] = interaction.fields.getTextInputValue('event_time').split(':');
                const hour = parseInt(hourStr);
                const minute = parseInt(minuteStr);

                // Unique ID
                const id = `ev_${Date.now()}`;

                // Check for duplicate name
                if (events.some(e => e.name.toLowerCase() === name.toLowerCase())) {
                    await interaction.reply({ content: 'Event name already exists.', ephemeral: true });
                    return;
                }

                events.push({ id, name, day, month, hour, minute, participants: [] });
                saveEvents();

                await interaction.reply({ content: `Event "${name}" created.`, ephemeral: true });
            }
        }
    } catch (err) {
        console.error(err);
        if (interaction.isRepliable()) {
            await interaction.reply({ content: 'An error occurred.', ephemeral: true }).catch(() => {});
        }
    }
}