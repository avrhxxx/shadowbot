import {
    Client,
    TextChannel,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Interaction
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

export async function initEventModule(client: Client) {

    client.once("ready", async () => {

        const guild = client.guilds.cache.first();
        if (!guild) return;

        let channel = guild.channels.cache.find(
            c => c.name === "moderation-panel" && c.isTextBased()
        ) as TextChannel;

        if (!channel) {
            channel = await guild.channels.create({
                name: "moderation-panel",
                type: 0
            }) as TextChannel;
        }

        // 🔥 SPRAWDŹ czy panel już istnieje (żeby nie spamował)
        const messages = await channel.messages.fetch({ limit: 20 });
        const existingPanel = messages.find(m =>
            m.author.id === client.user?.id &&
            m.content.includes("Event Management Panel")
        );

        if (existingPanel) return;

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("event_create")
                    .setLabel("Create Event")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("event_list")
                    .setLabel("List Events")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("event_help")
                    .setLabel("Help")
                    .setStyle(ButtonStyle.Success)
            );

        await channel.send({
            content: "📌 Event Management Panel",
            components: [row]
        });
    });

    client.on("interactionCreate", async (interaction: Interaction) => {

        // =====================
        // BUTTONS
        // =====================
        if (interaction.isButton()) {

            const events = loadEvents();

            // CREATE EVENT BUTTON
            if (interaction.customId === "event_create") {

                const modal = new ModalBuilder()
                    .setCustomId("modal_create_event")
                    .setTitle("Create Event");

                const nameInput = new TextInputBuilder()
                    .setCustomId("event_name")
                    .setLabel("Event Name")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const dateInput = new TextInputBuilder()
                    .setCustomId("event_date")
                    .setLabel("Date (DD-MM_HH:MM)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput)
                );

                await interaction.showModal(modal);
                return;
            }

            // LIST EVENTS
            if (interaction.customId === "event_list") {

                if (events.length === 0) {
                    await interaction.reply({ content: "No events yet.", ephemeral: true });
                    return;
                }

                const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);

                const list = sorted
                    .map(e => `• **${e.name}** (${new Date(e.timestamp).toLocaleString()})`)
                    .join("\n");

                await interaction.reply({
                    content: `📅 Events:\n${list}`,
                    ephemeral: true
                });

                return;
            }

            // HELP
            if (interaction.customId === "event_help") {

                await interaction.reply({
                    content:
                        `**Event Panel Help**\n\n` +
                        `• Create Event → Create new event\n` +
                        `• List Events → Show all events\n` +
                        `• Add → Add participant\n` +
                        `• Remove → Remove participant\n` +
                        `• Mark Absent → Set absent\n` +
                        `• List → Show participants`,
                    ephemeral: true
                });

                return;
            }

            // EVENT ACTION BUTTONS
            const parts = interaction.customId.split("_");
            if (parts.length === 2) {

                const action = parts[0];
                const eventId = parts[1];

                const event = events.find(e => e.id === eventId);
                if (!event) {
                    await interaction.reply({ content: "Event not found.", ephemeral: true });
                    return;
                }

                // LIST PARTICIPANTS
                if (action === "list") {

                    const present = event.participants.filter(p => p.present).map(p => p.nick);
                    const absent = event.participants.filter(p => !p.present).map(p => p.nick);

                    await interaction.reply({
                        content:
                            `**${event.name}**\n\n` +
                            `✅ Present: ${present.join(", ") || "none"}\n` +
                            `❌ Absent: ${absent.join(", ") || "none"}`,
                        ephemeral: true
                    });

                    return;
                }

                // OPEN MODAL FOR ADD / REMOVE / ABSENT
                if (["add", "remove", "absent"].includes(action)) {

                    const modal = new ModalBuilder()
                        .setCustomId(`modal_${action}_${eventId}`)
                        .setTitle(`${action.toUpperCase()} Participant`);

                    const nickInput = new TextInputBuilder()
                        .setCustomId("participant_nick")
                        .setLabel("Participant Nick")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    modal.addComponents(
                        new ActionRowBuilder<TextInputBuilder>().addComponents(nickInput)
                    );

                    await interaction.showModal(modal);
                    return;
                }
            }
        }

        // =====================
        // MODALS
        // =====================
        if (interaction.isModalSubmit()) {

            const events = loadEvents();

            // CREATE EVENT SUBMIT
            if (interaction.customId === "modal_create_event") {

                const name = interaction.fields.getTextInputValue("event_name");
                const dateStr = interaction.fields.getTextInputValue("event_date");

                const match = dateStr.match(/^(\d{2})-(\d{2})_(\d{2}):(\d{2})$/);

                if (!match) {
                    await interaction.reply({
                        content: "Invalid format. Use DD-MM_HH:MM (example: 15-03_20:00)",
                        ephemeral: true
                    });
                    return;
                }

                const [, day, month, hour, minute] = match;

                const now = new Date();
                const timestamp = new Date(
                    now.getFullYear(),
                    Number(month) - 1,
                    Number(day),
                    Number(hour),
                    Number(minute)
                ).getTime();

                const id = Date.now().toString();

                events.push({
                    id,
                    name,
                    timestamp,
                    participants: []
                });

                saveEvents(events);

                await interaction.reply({
                    content: `✅ Event **${name}** created!`,
                    ephemeral: true
                });

                // SEND EVENT PANEL
                const channel = interaction.channel as TextChannel;

                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`add_${id}`)
                            .setLabel("Add")
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`remove_${id}`)
                            .setLabel("Remove")
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId(`absent_${id}`)
                            .setLabel("Mark Absent")
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`list_${id}`)
                            .setLabel("List")
                            .setStyle(ButtonStyle.Success)
                    );

                await channel.send({
                    content: `📌 Event: **${name}**`,
                    components: [row]
                });

                return;
            }

            // ADD / REMOVE / ABSENT SUBMIT
            const parts = interaction.customId.split("_");
            if (parts.length === 3) {

                const action = parts[1];
                const eventId = parts[2];

                const event = events.find(e => e.id === eventId);
                if (!event) {
                    await interaction.reply({ content: "Event not found.", ephemeral: true });
                    return;
                }

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

                await interaction.reply({
                    content: `✅ Updated event **${event.name}**.`,
                    ephemeral: true
                });

                return;
            }
        }
    });
}