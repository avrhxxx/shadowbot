import { Client, ButtonInteraction, ModalSubmitInteraction, ActionRowBuilder, TextInputBuilder, TextInputStyle, SelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

interface Event {
    id: string;
    name: string;
    day: number;
    month: number;
    hour: number;
    minute: number;
    channelId?: string;
    reminderMinutes?: number;
    createdAt: number;
}

const DATA_PATH = path.join(__dirname, '../data/events.json');

let events: Event[] = [];
try {
    if (fs.existsSync(DATA_PATH)) {
        events = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    }
} catch (err) {
    console.error('Error loading events:', err);
}

export function saveEvents() {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2));
    } catch (err) {
        console.error('Error saving events:', err);
    }
}

export async function handleEventButton(interaction: ButtonInteraction, client: Client) {
    const [action, eventId] = interaction.customId.split(':');

    switch (action) {
        case 'create_event':
            const modal = new ModalSubmitInteraction({
                custom_id: 'modal_create_event',
                title: 'Create Event',
                components: [
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setCustomId('name')
                            .setLabel('Event Name')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setCustomId('day')
                            .setLabel('Day (1-31)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setCustomId('month')
                            .setLabel('Month (1-12)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setCustomId('time')
                            .setLabel('Time (HH:MM)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ),
                ],
            });
            await interaction.showModal(modal);
            break;

        case 'edit_event':
            const event = events.find(e => e.id === eventId);
            if (!event) return interaction.reply({ content: 'Event not found.', ephemeral: true });

            // Select menu dla kanału
            const channelMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
                new SelectMenuBuilder()
                    .setCustomId(`select_channel:${event.id}`)
                    .setPlaceholder('Select notification channel')
                    .addOptions(
                        ...(interaction.guild?.channels.cache
                            .filter(c => c.type === ChannelType.GuildText)
                            .map(c => ({ label: c.name, value: c.id })) || [])
                    )
            );

            // Select menu dla przypomnienia
            const reminderMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
                new SelectMenuBuilder()
                    .setCustomId(`select_reminder:${event.id}`)
                    .setPlaceholder('Reminder minutes before')
                    .addOptions(
                        Array.from({ length: 12 }, (_, i) => (i + 1) * 5).map(n => ({
                            label: `${n} minutes`,
                            value: n.toString(),
                        }))
                    )
            );

            await interaction.reply({
                content: `Configure event: **${event.name}**`,
                components: [channelMenu, reminderMenu],
                ephemeral: true,
            });
            break;

        case 'notify_event':
            {
                const event = events.find(e => e.id === eventId);
                if (!event || !event.channelId) return interaction.reply({ content: 'Cannot notify: missing channel.', ephemeral: true });

                const channel = interaction.guild?.channels.cache.get(event.channelId);
                if (channel?.isTextBased()) {
                    await channel.send(`🔔 Reminder for event **${event.name}** at ${event.hour}:${event.minute.toString().padStart(2,'0')} on ${event.day}/${event.month}`);
                    await interaction.reply({ content: 'Notification sent!', ephemeral: true });
                }
            }
            break;

        case 'delete_event':
            events = events.filter(e => e.id !== eventId);
            saveEvents();
            await interaction.reply({ content: 'Event deleted.', ephemeral: true });
            break;

        case 'download_list':
            {
                const event = events.find(e => e.id === eventId);
                if (!event) return interaction.reply({ content: 'Event not found.', ephemeral: true });
                // Tutaj wyślij listę uczestników jako prosty tekst
                await interaction.reply({ content: `Participant list for **${event.name}**: ...`, ephemeral: true });
            }
            break;
    }
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
    if (interaction.customId === 'modal_create_event') {
        const name = interaction.fields.getTextInputValue('name');
        const day = parseInt(interaction.fields.getTextInputValue('day'));
        const month = parseInt(interaction.fields.getTextInputValue('month'));
        const [hourStr, minStr] = interaction.fields.getTextInputValue('time').split(':');
        const hour = parseInt(hourStr);
        const minute = parseInt(minStr);

        // Sprawdzenie duplikatu
        if (events.some(e => e.name === name)) {
            return interaction.reply({ content: 'Event with this name already exists.', ephemeral: true });
        }

        const newEvent: Event = {
            id: `${Date.now()}`,
            name,
            day,
            month,
            hour,
            minute,
            createdAt: Date.now(),
        };

        events.push(newEvent);
        saveEvents();

        await interaction.reply({ content: `Event **${name}** created.`, ephemeral: true });
    }
}

export function renderEventList(guildId: string) {
    // Zwraca embedy + komponenty dla listy eventów
    const embed = new EmbedBuilder().setTitle('Events List');
    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    events.forEach(event => {
        const isPast = new Date(event.month, event.day, event.hour, event.minute) < new Date();

        const buttons = new ActionRowBuilder<ButtonBuilder>();
        if (!isPast) {
            buttons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`notify_event:${event.id}`)
                    .setLabel('🔔')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`delete_event:${event.id}`)
                    .setLabel('🗑')
                    .setStyle(ButtonStyle.Danger)
            );
        } else {
            buttons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`download_list:${event.id}`)
                    .setLabel('📥')
                    .setStyle(ButtonStyle.Secondary)
            );
        }

        embed.addFields({
            name: event.name,
            value: `Date: ${event.day}/${event.month} ${event.hour}:${event.minute.toString().padStart(2,'0')}`,
        });

        components.push(buttons);
    });

    return { embed, components };
}