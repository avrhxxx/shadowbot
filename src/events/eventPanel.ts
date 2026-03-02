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

// ===== Obsługa workflow Create Event i List Events =====
export async function initEventPanel(client: any) {
    client.on("interactionCreate", async (interaction: Interaction) => {
        // === CREATE EVENT BUTTON ===
        if (interaction.isButton() && interaction.customId === "create_event") {
            // Modal 1: Event Name
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

        // === LIST EVENTS BUTTON ===
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

        // === PODPINA MODALE DO CREATE EVENT i PARTICIPANT ===
        // (Workflow z modali: name → month → day → hour)
        if (interaction.isModalSubmit()) {
            // Obsługa workflow Create Event i modali uczestników
            const parts = interaction.customId.split("_");

            if (interaction.customId.startsWith("modal_event_name")) {
                const name = interaction.fields.getTextInputValue("event_name");
                const modalMonth = new ModalBuilder()
                    .setCustomId(`modal_event_month_${name}`)
                    .setTitle("Event Month");

                const monthInput = new TextInputBuilder()
                    .setCustomId("event_month")
                    .setLabel("Month (1-12)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modalMonth.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput));
                await interaction.showModal(modalMonth);
                return;
            }

            if (interaction.customId.startsWith("modal_event_month_")) {
                const name = parts.slice(3).join("_");
                const month = Number(interaction.fields.getTextInputValue("event_month"));

                const modalDay = new ModalBuilder()
                    .setCustomId(`modal_event_day_${name}_${month}`)
                    .setTitle("Event Day");

                const dayInput = new TextInputBuilder()
                    .setCustomId("event_day")
                    .setLabel("Day (1-31)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modalDay.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput));
                await interaction.showModal(modalDay);
                return;
            }

            if (interaction.customId.startsWith("modal_event_day_")) {
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

            if (interaction.customId.startsWith("modal_event_hour_")) {
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

                events.push({ id, name, timestamp, participants: [] });
                saveEvents(events);

                await interaction.reply({
                    content: `✅ Event **${name}** created for ${day}-${month} at ${hourStr}.`,
                    ephemeral: true
                });
                return;
            }
        }
    });
}