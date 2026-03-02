import {
    Interaction,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextChannel
} from "discord.js";
import fs from "fs";
import path from "path";

interface EventParticipant {
    nick: string;
    present: boolean;
}

interface EventData {
    id: string;
    name: string;
    timestamp: number;
    notifyChannelId?: string;
    notifyMinutesBefore?: number;
    participants: EventParticipant[];
}

const DATA_PATH = path.join(__dirname, "../data/events.json");

// ===== Funkcje do wczytywania i zapisywania =====
function loadEvents(): EventData[] {
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    } catch {
        return [];
    }
}

function saveEvents(events: EventData[]) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2), "utf-8");
}

// ===== Helper: generowanie ID =====
function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

// ===== Embed Event Panel =====
export async function handleEventButton(interaction: Interaction) {
    if (!interaction.isButton()) return;

    const embed = new EmbedBuilder()
        .setTitle("📌 Event Panel")
        .setDescription("Select an action:");

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("create_event")
                .setLabel("Create Event")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("list_events")
                .setLabel("List Events")
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
    });
}

// ===== Event Panel Workflow =====
export async function initEventPanel(client: any) {
    client.on("interactionCreate", async (interaction: Interaction) => {

        const events = loadEvents();

        // ===== BUTTON: Create Event =====
        if (interaction.isButton() && interaction.customId === "create_event") {
            const modal = new ModalBuilder()
                .setCustomId("modal_create_event")
                .setTitle("Create Event");

            const nameInput = new TextInputBuilder()
                .setCustomId("event_name")
                .setLabel("Event Name")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const dayInput = new TextInputBuilder()
                .setCustomId("event_day")
                .setLabel("Day (1-31)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const monthInput = new TextInputBuilder()
                .setCustomId("event_month")
                .setLabel("Month (1-12)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const timeInput = new TextInputBuilder()
                .setCustomId("event_time")
                .setLabel("Time (HH:MM)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput)
            );

            await interaction.showModal(modal);
            return;
        }

        // ===== BUTTON: List Events =====
        if (interaction.isButton() && interaction.customId === "list_events") {
            if (events.length === 0) {
                await interaction.reply({ content: "No events yet.", ephemeral: true });
                return;
            }

            const row = new ActionRowBuilder<ButtonBuilder>();
            const embed = new EmbedBuilder().setTitle("Event List").setDescription("Select an event:");

            const now = Date.now();
            events.forEach(e => {
                const isPast = e.timestamp < now;
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`event_${e.id}`)
                        .setLabel(e.name)
                        .setStyle(isPast ? ButtonStyle.Danger : ButtonStyle.Success)
                );
            });

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            return;
        }

        // ===== BUTTON: Specific Event =====
        if (interaction.isButton() && interaction.customId.startsWith("event_")) {
            const id = interaction.customId.split("_")[1];
            const event = events.find(e => e.id === id);
            if (!event) return await interaction.reply({ content: "Event not found.", ephemeral: true });

            const now = Date.now();
            const isPast = event.timestamp < now;

            const embed = new EmbedBuilder()
                .setTitle(`Event: ${event.name}`)
                .setDescription(`Date: ${new Date(event.timestamp).toLocaleString()}`);

            const row = new ActionRowBuilder<ButtonBuilder>();

            // Nadchodzący event
            if (!isPast) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`bell_${id}`)
                        .setLabel("🔔 Reminder")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`delete_${id}`)
                        .setLabel("🗑 Delete Event")
                        .setStyle(ButtonStyle.Danger)
                );
            }

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`list_participants_${id}`)
                    .setLabel("List Participants")
                    .setStyle(ButtonStyle.Secondary)
            );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            return;
        }

        // ===== BUTTON: Delete Event =====
        if (interaction.isButton() && interaction.customId.startsWith("delete_")) {
            const id = interaction.customId.split("_")[1];
            const index = events.findIndex(e => e.id === id);
            if (index === -1) return await interaction.reply({ content: "Event not found.", ephemeral: true });

            events.splice(index, 1);
            saveEvents(events);
            await interaction.reply({ content: `✅ Event deleted.`, ephemeral: true });
            return;
        }

        // ===== BUTTON: Reminder (manual) =====
        if (interaction.isButton() && interaction.customId.startsWith("bell_")) {
            const id = interaction.customId.split("_")[1];
            const event = events.find(e => e.id === id);
            if (!event) return await interaction.reply({ content: "Event not found.", ephemeral: true });

            const channel = interaction.guild?.channels.cache.get(event.notifyChannelId || "") as TextChannel;
            if (!channel) return await interaction.reply({ content: "Notification channel not found.", ephemeral: true });

            await channel.send(`🔔 Reminder: Event **${event.name}** starts at ${new Date(event.timestamp).toLocaleString()}`);
            await interaction.reply({ content: "✅ Reminder sent.", ephemeral: true });
            return;
        }

        // ===== MODAL SUBMIT: Create Event =====
        if (interaction.isModalSubmit() && interaction.customId === "modal_create_event") {
            const name = interaction.fields.getTextInputValue("event_name");
            const day = parseInt(interaction.fields.getTextInputValue("event_day"));
            const month = parseInt(interaction.fields.getTextInputValue("event_month"));
            const time = interaction.fields.getTextInputValue("event_time"); // HH:MM

            // Walidacja prostych danych
            if (!name || isNaN(day) || isNaN(month) || !time.match(/^\d{1,2}:\d{2}$/)) {
                await interaction.reply({ content: "❌ Invalid input. Try again.", ephemeral: true });
                return;
            }

            if (events.some(e => e.name === name)) {
                await interaction.reply({ content: "❌ Event with this name already exists.", ephemeral: true });
                return;
            }

            const [hour, minute] = time.split(":").map(Number);
            const year = new Date().getFullYear();
            const eventDate = new Date(year, month - 1, day, hour, minute).getTime();

            const newEvent: EventData = {
                id: generateId(),
                name,
                timestamp: eventDate,
                participants: []
            };

            events.push(newEvent);
            saveEvents(events);

            // Następnie możemy tu wyświetlić select menu dla kanału i przypomnienia automatycznego
            const channelSelect = new StringSelectMenuBuilder()
                .setCustomId(`select_channel_${newEvent.id}`)
                .setPlaceholder("Select notification channel")
                .addOptions(
                    interaction.guild?.channels.cache
                        .filter(c => c.isTextBased())
                        .map(c => new StringSelectMenuOptionBuilder()
                            .setLabel(c.name)
                            .setValue(c.id)
                        ) || []
                );

            const reminderSelect = new StringSelectMenuBuilder()
                .setCustomId(`select_reminder_${newEvent.id}`)
                .setPlaceholder("Select reminder time")
                .addOptions(
                    [10,20,30,40,50,60].map(min => 
                        new StringSelectMenuOptionBuilder()
                            .setLabel(`${min} minutes before`)
                            .setValue(String(min))
                    )
                );

            const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(channelSelect);
            const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(reminderSelect);

            await interaction.reply({ content: "✅ Event created! Select channel and reminder:", components: [row1, row2], ephemeral: true });
            return;
        }

        // ===== SELECT MENU: Channel / Reminder =====
        if (interaction.isStringSelectMenu()) {
            const [type, id] = interaction.customId.split("_").slice(0,2);
            const event = events.find(e => e.id === id);
            if (!event) return await interaction.reply({ content: "Event not found.", ephemeral: true });

            if (type === "select") {
                if (interaction.customId.startsWith("select_channel_")) {
                    event.notifyChannelId = interaction.values[0];
                    saveEvents(events);
                    await interaction.reply({ content: `✅ Notification channel set.`, ephemeral: true });
                    return;
                }
                if (interaction.customId.startsWith("select_reminder_")) {
                    event.notifyMinutesBefore = parseInt(interaction.values[0]);
                    saveEvents(events);
                    await interaction.reply({ content: `✅ Reminder time set.`, ephemeral: true });
                    return;
                }
            }
        }
    });
}