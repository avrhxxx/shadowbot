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
    notifyMinutesBefore?: number;
}

// ---- Ścieżki do danych ----
const DATA_DIR = path.join(__dirname, "../data");
const DATA_PATH = path.join(DATA_DIR, "events.json");

// ---- Pomocnicze funkcje do pliku ----
function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, "[]", "utf-8");
}

function loadEvents(): EventData[] {
    ensureDataFile();
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    } catch {
        return [];
    }
}

function saveEvents(events: EventData[]) {
    ensureDataFile();
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

            const notifyInput = new TextInputBuilder()
                .setCustomId("notify_minutes")
                .setLabel("Minutes before notification (optional)")
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(hourInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(notifyInput)
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
                const hourStr = interaction.fields.getTextInputValue("event_hour");
                const notifyMinutesStr = interaction.fields.getTextInputValue("notify_minutes");

                if (!name || !day || !month || !hourStr) {
                    return await interaction.reply({ content: "Invalid input. Please try again.", ephemeral: true });
                }

                const [hour, minute] = hourStr.split(":").map(Number);
                const now = new Date();
                const timestamp = new Date(now.getFullYear(), month - 1, day, hour, minute).getTime();

                const events = loadEvents();
                const id = Date.now().toString();

                events.push({
                    id,
                    name,
                    timestamp,
                    participants: [],
                    notifyMinutesBefore: notifyMinutesStr ? Number(notifyMinutesStr) : undefined
                });

                saveEvents(events);

                await interaction.reply({
                    content: `✅ Event **${name}** created for ${day}-${month} at ${hourStr}.`,
                    ephemeral: true
                });
            } catch (err) {
                console.error("Error creating event:", err);
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

        // ===== BUTTONS: Event Details / Participants =====
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

        // ===== MODAL SUBMITS: Participants =====
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