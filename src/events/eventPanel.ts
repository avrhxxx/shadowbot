// src/events/eventPanel.ts
import {
    Interaction,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder
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

            const hourInput = new TextInputBuilder()
                .setCustomId("event_hour")
                .setLabel("Hour (HH:MM)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const reminderInput = new TextInputBuilder()
                .setCustomId("event_reminder")
                .setLabel("Reminder (minutes before event)")
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(hourInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(reminderInput)
            );

            await interaction.showModal(modal);
            return;
        }

        // ===== BUTTON: List Events =====
        if (interaction.isButton() && interaction.customId === "list_events") {
            const events = loadEvents();
            if (events.length === 0) {
                await interaction.reply({ content: "No events yet.", ephemeral: true });
                return;
            }

            const row = new ActionRowBuilder<ButtonBuilder>();
            const embed = new EmbedBuilder().setTitle("Event List").setDescription("Select an event:");

            events.forEach(e => {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`event_${e.id}`)
                        .setLabel(e.name)
                        .setStyle(ButtonStyle.Secondary)
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

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            return;
        }

        // ===== BUTTONS: Add / Remove / Absent / List Participants =====
        if (interaction.isButton()) {
            const parts = interaction.customId.split("_");
            const action = parts[0];
            const id = parts[1];
            if (!["add","remove","absent","list"].includes(action)) return;

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
        }

        // ===== MODAL SUBMITS =====
        if (interaction.isModalSubmit()) {
            try {
                // Create Event workflow
                if (interaction.customId === "modal_create_event") {
                    await interaction.deferReply({ ephemeral: true });

                    const name = interaction.fields.getTextInputValue("event_name");
                    const day = Number(interaction.fields.getTextInputValue("event_day"));
                    const month = Number(interaction.fields.getTextInputValue("event_month"));
                    const hourStr = interaction.fields.getTextInputValue("event_hour");
                    const [hour, minute] = hourStr.split(":").map(Number);
                    const reminderStr = interaction.fields.getTextInputValue("event_reminder");

                    let reminderMinutes = 0;
                    if (reminderStr) {
                        const [h, m] = reminderStr.split(":").map(Number);
                        if (!isNaN(h) && !isNaN(m)) reminderMinutes = h * 60 + m;
                    }

                    if (
                        day < 1 || day > 31 ||
                        month < 1 || month > 12 ||
                        hour < 0 || hour > 23 ||
                        minute < 0 || minute > 59
                    ) {
                        return await interaction.editReply({ content: "❌ Invalid date or time." });
                    }

                    const now = new Date();
                    const timestamp = new Date(now.getFullYear(), month - 1, day, hour, minute).getTime();

                    const events = loadEvents();
                    const id = Date.now().toString();

                    events.push({
                        id,
                        name,
                        timestamp,
                        participants: [],
                        reminderMinutes
                    });

                    saveEvents(events);

                    await interaction.editReply({
                        content: `✅ Event **${name}** created for ${day}-${month} at ${hourStr}. Reminder: ${reminderMinutes} minutes before.`
                    });
                    return;
                }

                // Add/Remove/Absent participants
                if (interaction.customId.startsWith("modal_")) {
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

            } catch (err) {
                console.error("Error in modal submit:", err);
                if (!interaction.replied) {
                    await interaction.reply({ content: "❌ Something went wrong, try again.", ephemeral: true });
                }
            }
        }

    });
}