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

// ===== Obsługa workflow Create Event i List Events + uczestnicy =====
export async function initEventPanel(client: any) {
    client.on("interactionCreate", async (interaction: Interaction) => {

        // ===== BUTTON: Create Event =====
        if (interaction.isButton() && interaction.customId === "create_event") {
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

            // ignore main buttons
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

        // ===== MODALE Create Event workflow zostaje jak wcześniej =====
    });
}