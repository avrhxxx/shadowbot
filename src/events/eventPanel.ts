// src/events/eventPanel.ts
import {
    Interaction,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    TextChannel,
    Client,
    ChannelType
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
    reminderMinutes: number;
    channelId: string; // gdzie wysłać powiadomienie
    participants: EventParticipant[];
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
    fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2), "utf-8");
}

// ===== Embed z Event Panel (po kliknięciu Event Menu) =====
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

// ===== Obsługa workflow Create Event i List Events + uczestnicy =====
export async function initEventPanel(client: Client) {
    client.on("interactionCreate", async (interaction: Interaction) => {

        // ===== BUTTON: Create Event =====
        if (interaction.isButton() && interaction.customId === "create_event") {
            // Modal z 6 liniami: nazwa, dzień, miesiąc, godzina, przypomnienie, kanał
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

            const hourInput = new TextInputBuilder()
                .setCustomId("event_hour")
                .setLabel("Hour (HH:MM)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const reminderInput = new TextInputBuilder()
                .setCustomId("event_reminder")
                .setLabel("Reminder before event (minutes)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const channelInput = new TextInputBuilder()
                .setCustomId("event_channel")
                .setLabel("Channel ID for notifications")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(hourInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(reminderInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput)
            );

            await interaction.showModal(modal);
            return;
        }

        // ===== MODAL SUBMIT: Create Event =====
        if (interaction.isModalSubmit() && interaction.customId === "modal_create_event") {
            try {
                const name = interaction.fields.getTextInputValue("event_name");
                const day = Number(interaction.fields.getTextInputValue("event_day"));
                const month = Number(interaction.fields.getTextInputValue("event_month"));
                const hourParts = interaction.fields.getTextInputValue("event_hour").split(":");
                const hour = Number(hourParts[0]);
                const minute = Number(hourParts[1]);
                const reminderMinutes = Number(interaction.fields.getTextInputValue("event_reminder"));
                const channelId = interaction.fields.getTextInputValue("event_channel");

                const events = loadEvents();

                // Sprawdzenie, czy nazwa eventu już istnieje
                if (events.some(e => e.name.toLowerCase() === name.toLowerCase())) {
                    await interaction.reply({ content: "❌ Event with this name already exists.", ephemeral: true });
                    return;
                }

                const timestamp = new Date(new Date().getFullYear(), month - 1, day, hour, minute).getTime();
                const id = Date.now().toString();

                events.push({
                    id,
                    name,
                    timestamp,
                    reminderMinutes,
                    channelId,
                    participants: []
                });

                saveEvents(events);

                await interaction.reply({ content: `✅ Event **${name}** created for ${day}-${month} at ${hourParts.join(":")}.`, ephemeral: true });
            } catch (e) {
                console.error("Error creating event:", e);
                await interaction.reply({ content: "❌ Something went wrong. Try again.", ephemeral: true });
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
            const rows: ActionRowBuilder<ButtonBuilder>[] = [];
            let row = new ActionRowBuilder<ButtonBuilder>();

            events.forEach((event, index) => {
                const isPast = event.timestamp < Date.now();
                const btn = new ButtonBuilder()
                    .setCustomId(`event_${event.id}`)
                    .setLabel(event.name)
                    .setStyle(isPast ? ButtonStyle.Danger : ButtonStyle.Success);

                row.addComponents(btn);
                if ((index + 1) % 5 === 0) { // max 5 per row
                    rows.push(row);
                    row = new ActionRowBuilder<ButtonBuilder>();
                }
            });
            if (row.components.length > 0) rows.push(row);

            await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
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

            const isPast = event.timestamp < Date.now();
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
                        .setStyle(ButtonStyle.Secondary)
                );

            // Dzwoneczek i kosz tylko jeśli event nie minął
            if (!isPast) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`reminder_${id}`)
                        .setLabel("🔔 Reminder")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`delete_${id}`)
                        .setLabel("🗑️ Delete")
                        .setStyle(ButtonStyle.Danger)
                );
            }

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            return;
        }

        // ===== BUTTONS: Add / Remove / Absent / List Participants =====
        if (interaction.isButton()) {
            const parts = interaction.customId.split("_");
            const action = parts[0];
            const id = parts[1];
            if (!["add","remove","absent","list","reminder","delete"].includes(action)) return;

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

            if (action === "reminder") {
                const channel = interaction.guild?.channels.cache.get(event.channelId) as TextChannel;
                if (!channel) return await interaction.reply({ content: "Channel not found.", ephemeral: true });
                await channel.send(`🔔 Reminder: Event **${event.name}** starts in ${event.reminderMinutes} minutes!`);
                await interaction.reply({ content: "✅ Reminder sent.", ephemeral: true });
                return;
            }

            if (action === "delete") {
                const filtered = events.filter(e => e.id !== id);
                saveEvents(filtered);
                await interaction.reply({ content: `🗑️ Event **${event.name}** deleted.`, ephemeral: true });
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