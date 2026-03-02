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
    participants: EventParticipant[];
    channelId?: string;
    reminderMinutes?: number;
}

const DATA_PATH = path.join(__dirname, "../data/events.json");

function loadEvents(): EventData[] {
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    } catch {
        return [];
    }
}

function saveEvents(events: EventData[]) {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, "[]", "utf-8");
    fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2), "utf-8");
}

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

export async function initEventPanel(client: any) {
    client.on("interactionCreate", async (interaction: Interaction) => {

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

            const reminderInput = new TextInputBuilder()
                .setCustomId("event_reminder")
                .setLabel("Reminder (minutes before event)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(reminderInput)
            );

            await interaction.showModal(modal);
            return;
        }

        // ===== MODAL SUBMIT: Create Event =====
        if (interaction.isModalSubmit() && interaction.customId === "modal_create_event") {
            const name = interaction.fields.getTextInputValue("event_name");
            const day = parseInt(interaction.fields.getTextInputValue("event_day"));
            const month = parseInt(interaction.fields.getTextInputValue("event_month"));
            const time = interaction.fields.getTextInputValue("event_time");
            const reminder = parseInt(interaction.fields.getTextInputValue("event_reminder"));

            const [hours, minutes] = time.split(":").map(Number);
            const timestamp = new Date(new Date().getFullYear(), month - 1, day, hours, minutes).getTime();

            const events = loadEvents();

            if (events.some(e => e.name === name)) {
                await interaction.reply({ content: "❌ Event with this name already exists.", ephemeral: true });
                return;
            }

            const newEvent: EventData = {
                id: `${Date.now()}`,
                name,
                timestamp,
                participants: [],
                reminderMinutes: reminder
            };

            events.push(newEvent);
            saveEvents(events);

            await interaction.reply({ content: `✅ Event **${name}** created!`, ephemeral: true });

            // Select menu tylko dla kanału powiadomień
            if (interaction.guild) {
                const channelSelect = new StringSelectMenuBuilder()
                    .setCustomId(`select_channel_${newEvent.id}`)
                    .setPlaceholder("Select notification channel")
                    .addOptions(
                        interaction.guild.channels.cache
                            .filter(c => c.isTextBased())
                            .map(c => new StringSelectMenuOptionBuilder()
                                .setLabel(c.name)
                                .setValue(c.id)
                            )
                    );

                const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(channelSelect);
                await interaction.followUp({ content: "Select channel for notifications:", components: [row], ephemeral: true });
            }
            return;
        }

        // ===== BUTTON: List Events =====
        if (interaction.isButton() && interaction.customId === "list_events") {
            const events = loadEvents();
            if (events.length === 0) {
                await interaction.reply({ content: "No events yet.", ephemeral: true });
                return;
            }

            const embed = new EmbedBuilder().setTitle("Event List").setDescription("Select an event:");
            const row = new ActionRowBuilder<ButtonBuilder>();

            events.forEach(e => {
                const isPast = e.timestamp < Date.now();
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
            const events = loadEvents();
            const event = events.find(e => e.id === id);
            if (!event) return await interaction.reply({ content: "Event not found.", ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle(`Event: ${event.name}`)
                .setDescription(`Date: ${new Date(event.timestamp).toLocaleString()}`);

            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`add_${id}`)
                        .setLabel("Add Participant")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`remove_${id}`)
                        .setLabel("Remove Participant")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`absent_${id}`)
                        .setLabel("Mark Absent")
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`list_${id}`)
                        .setLabel("List Participants")
                        .setStyle(ButtonStyle.Success)
                );

            if (event.timestamp > Date.now()) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`notify_${id}`)
                        .setLabel("🔔 Notify")
                        .setStyle(ButtonStyle.Primary)
                );
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`delete_${id}`)
                        .setLabel("🗑 Delete")
                        .setStyle(ButtonStyle.Danger)
                );
            }

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            return;
        }

        // ===== HANDLE PARTICIPANT BUTTONS =====
        if (interaction.isButton()) {
            const parts = interaction.customId.split("_");
            const action = parts[0];
            const id = parts[1];

            if (!["add","remove","absent","list","notify","delete"].includes(action)) return;

            const events = loadEvents();
            const event = events.find(e => e.id === id);
            if (!event) return await interaction.reply({ content: "Event not found.", ephemeral: true });

            if (["add","remove","absent"].includes(action)) {
                const modal = new ModalBuilder()
                    .setCustomId(`modal_${action}_${id}`)
                    .setTitle(`${action.toUpperCase()} Participant`);

                const nickInput = new TextInputBuilder()
                    .setCustomId("participant_nick")
                    .setLabel("Participant Nick")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nickInput));
                await interaction.showModal(modal);
                return;
            }

            if (action === "list") {
                const present = event.participants.filter(p => p.present).map(p => p.nick);
                const absent = event.participants.filter(p => !p.present).map(p => p.nick);

                await interaction.reply({
                    content: `**${event.name}**\n\n✅ Present: ${present.join(", ") || "none"}\n❌ Absent: ${absent.join(", ") || "none"}`,
                    ephemeral: true
                });
                return;
            }

            if (action === "notify") {
                const channel = interaction.guild?.channels.cache.get(event.channelId || "");
                if (channel && channel.isTextBased()) {
                    await (channel as TextChannel).send(`Reminder: Event **${event.name}** starts soon!`);
                    await interaction.reply({ content: "🔔 Notification sent!", ephemeral: true });
                } else {
                    await interaction.reply({ content: "Channel not found for notification.", ephemeral: true });
                }
                return;
            }

            if (action === "delete") {
                const idx = events.findIndex(e => e.id === id);
                if (idx !== -1) {
                    events.splice(idx, 1);
                    saveEvents(events);
                    await interaction.reply({ content: "🗑 Event deleted.", ephemeral: true });
                }
                return;
            }
        }

        // ===== MODAL SUBMITS: Add/Remove/Absent Participants =====
        if (interaction.isModalSubmit() && interaction.customId.startsWith("modal_")) {
            const parts = interaction.customId.split("_");
            const action = parts[1];
            const id = parts[2];
            const events = loadEvents();
            const event = events.find(e => e.id === id);
            if (!event) return await interaction.reply({ content: "Event not found.", ephemeral: true });

            const nick = interaction.fields.getTextInputValue("participant_nick");

            if (action === "add") {
                if (!event.participants.some(p => p.nick === nick)) {
                    event.participants.push({ nick, present: true });
                }
            }
            if (action === "remove") {
                event.participants = event.participants.filter(p => p.nick !== nick);
            }
            if (action === "absent") {
                const p = event.participants.find(p => p.nick === nick);
                if (p) p.present = false;
            }

            saveEvents(events);
            await interaction.reply({ content: `✅ Updated event **${event.name}**.`, ephemeral: true });
            return;
        }
    });
}