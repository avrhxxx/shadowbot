// src/events/eventPanel.ts
import {
    Client,
    TextChannel,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    Interaction,
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

export async function initEventPanel(client: Client) {
    client.on("interactionCreate", async (interaction: Interaction) => {

        // ===== BUTTON: Create Event =====
        if (interaction.isButton() && interaction.customId === "create_event") {
            // 🔹 Modal 1: Event Name
            const modal = new ModalBuilder()
                .setCustomId("modal_event_name")
                .setTitle("Event Name");

            const nameInput = new TextInputBuilder()
                .setCustomId("event_name")
                .setLabel("Enter event name")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput));
            await interaction.showModal(modal);
            return;
        }

        // ===== MODAL SUBMITS =====
        if (interaction.isModalSubmit()) {

            // 🔹 Event Name → ask for Month
            if (interaction.customId === "modal_event_name") {
                const name = interaction.fields.getTextInputValue("event_name");
                await interaction.reply({ content: "Enter month (1-12):", ephemeral: true });

                // 🔹 Store temporary data in interaction ephemeral for next modal
                await interaction.followUp({
                    content: "Month:",
                    ephemeral: true
                });

                const modalMonth = new ModalBuilder()
                    .setCustomId(`modal_event_month_${name}`)
                    .setTitle("Event Month");

                const monthInput = new TextInputBuilder()
                    .setCustomId("event_month")
                    .setLabel("Month number (1-12)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modalMonth.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput));
                await interaction.showModal(modalMonth);
                return;
            }

            // 🔹 Month → ask for Day
            if (interaction.customId.startsWith("modal_event_month_")) {
                const name = interaction.customId.split("_").slice(3).join("_");
                const month = Number(interaction.fields.getTextInputValue("event_month"));

                const modalDay = new ModalBuilder()
                    .setCustomId(`modal_event_day_${name}_${month}`)
                    .setTitle("Event Day");

                const dayInput = new TextInputBuilder()
                    .setCustomId("event_day")
                    .setLabel("Day number (1-31)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modalDay.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput));
                await interaction.showModal(modalDay);
                return;
            }

            // 🔹 Day → ask for Hour
            if (interaction.customId.startsWith("modal_event_day_")) {
                const parts = interaction.customId.split("_");
                const name = parts[3];
                const month = Number(parts[4]);
                const day = Number(interaction.fields.getTextInputValue("event_day"));

                const modalHour = new ModalBuilder()
                    .setCustomId(`modal_event_hour_${name}_${month}_${day}`)
                    .setTitle("Event Hour");

                const hourInput = new TextInputBuilder()
                    .setCustomId("event_hour")
                    .setLabel("Hour (HH:MM)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modalHour.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(hourInput));
                await interaction.showModal(modalHour);
                return;
            }

            // 🔹 Hour → final save
            if (interaction.customId.startsWith("modal_event_hour_")) {
                const parts = interaction.customId.split("_");
                const name = parts[3];
                const month = Number(parts[4]);
                const day = Number(parts[5]);
                const hourStr = interaction.fields.getTextInputValue("event_hour");
                const [hour, minute] = hourStr.split(":").map(Number);

                const now = new Date();
                const timestamp = new Date(
                    now.getFullYear(),
                    month - 1,
                    day,
                    hour,
                    minute
                ).getTime();

                const events = loadEvents();
                const id = Date.now().toString();

                events.push({
                    id,
                    name,
                    timestamp,
                    participants: []
                });

                saveEvents(events);

                await interaction.reply({
                    content: `✅ Event **${name}** created for ${day}-${month} at ${hourStr}.`,
                    ephemeral: true
                });
                return;
            }
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

        // ===== BUTTONS FOR SINGLE EVENT =====
        if (interaction.isButton() && interaction.customId.startsWith("event_")) {
            const id = interaction.customId.split("_")[1];
            const events = loadEvents();
            const event = events.find(e => e.id === id);
            if (!event) {
                await interaction.reply({ content: "Event not found.", ephemeral: true });
                return;
            }

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
            if (parts.length === 2) return; // ignore main buttons

            const action = parts[0];
            const id = parts[1];
            const events = loadEvents();
            const event = events.find(e => e.id === id);
            if (!event) {
                await interaction.reply({ content: "Event not found.", ephemeral: true });
                return;
            }

            // Add / Remove / Absent → modal
            if (["add", "remove", "absent"].includes(action)) {
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

            // List participants
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

        // ===== MODAL SUBMITS FOR PARTICIPANTS =====
        if (interaction.isModalSubmit()) {
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
        }

    });
}