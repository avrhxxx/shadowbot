// src/modules/EventModule.ts
import { Client, Message, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, InteractionCollector, ModalBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction } from "discord.js";
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

// Wczytanie istniejących eventów
function loadEvents(): EventData[] {
    try {
        const raw = fs.readFileSync(DATA_PATH, "utf-8");
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

// Zapis eventów
function saveEvents(events: EventData[]) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2), "utf-8");
}

export async function initEventModule(client: Client) {
    // Stworzenie dedykowanego kanału
    let modChannel: TextChannel | undefined;
    client.on("ready", async () => {
        const guild = client.guilds.cache.first();
        if (!guild) return;
        modChannel = guild.channels.cache.find(c => c.name === "moderation-panel" && c.isTextBased()) as TextChannel;
        if (!modChannel) {
            modChannel = await guild.channels.create({
                name: "moderation-panel",
                type: 0 // GUILD_TEXT
            }) as TextChannel;
        }

        // Wyślij główny panel eventów
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder().setCustomId("event_create").setLabel("Create Event").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("event_list").setLabel("List Events").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("event_compare").setLabel("Compare").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("event_help").setLabel("Help").setStyle(ButtonStyle.Success)
            );
        await modChannel.send({ content: "Event Management Panel", components: [row] });
    });

    client.on("interactionCreate", async interaction => {
        if (!interaction.isButton()) return;
        if (!modChannel || interaction.channelId !== modChannel.id) return;

        const events = loadEvents();

        // Tworzenie eventu
        if (interaction.customId === "event_create") {
            await interaction.deferReply({ ephemeral: true });
            const modal = new ModalBuilder()
                .setCustomId("modal_create_event")
                .setTitle("Create Event")
                .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder().setCustomId("event_name").setLabel("Event Name").setStyle(TextInputStyle.Short).setRequired(true)
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder().setCustomId("event_date").setLabel("Date (DD-MM_HH:MM)").setStyle(TextInputStyle.Short).setRequired(true)
                    )
                );
            await interaction.showModal(modal);
        }

        // Lista eventów
        if (interaction.customId === "event_list") {
            await interaction.deferReply({ ephemeral: true });
            if (events.length === 0) {
                await interaction.editReply("No events created yet.");
                return;
            }
            const listText = events.map(e => `**${e.name}** (${new Date(e.timestamp).toLocaleString()})`).join("\n");
            await interaction.editReply(`Events:\n${listText}`);
        }

        // Compare (placeholder)
        if (interaction.customId === "event_compare") {
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply("Compare feature not implemented yet.");
        }

        // Help
        if (interaction.customId === "event_help") {
            await interaction.deferReply({ ephemeral: true });
            const helpText = `
**Event Panel Help**
- **Create Event**: Create a new event by entering name and date.
- **List Events**: Shows all scheduled events.
- **Compare**: Compare weekly participant lists.
- **Add/Remove/Mark Absent**: Manage participants (after selecting event).
`;
            await interaction.editReply(helpText);
        }
    });

    // Obsługa modali
    client.on("interactionCreate", async interaction => {
        if (!interaction.isModalSubmit()) return;

        // Tworzenie eventu z modala
        if (interaction.customId === "modal_create_event") {
            const name = interaction.fields.getTextInputValue("event_name");
            const dateStr = interaction.fields.getTextInputValue("event_date");

            const [day, month, hourMin] = dateStr.split(/[-_]/);
            const [hour, min] = hourMin.split(":");
            const now = new Date();
            const timestamp = new Date(now.getFullYear(), Number(month)-1, Number(day), Number(hour), Number(min)).getTime();

            if (isNaN(timestamp)) {
                await interaction.reply({ content: "Invalid date format.", ephemeral: true });
                return;
            }

            const events = loadEvents();
            const id = `event_${Date.now()}`;
            events.push({ id, name, timestamp, participants: [] });
            saveEvents(events);

            await interaction.reply({ content: `Event **${name}** created!`, ephemeral: true });

            // Przyciski Add/Remove/Absent/List dla tego eventu
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder().setCustomId(`add_${id}`).setLabel("Add").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`remove_${id}`).setLabel("Remove").setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId(`absent_${id}`).setLabel("Mark Absent").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`list_${id}`).setLabel("List").setStyle(ButtonStyle.Secondary)
                );
            if (modChannel) await modChannel.send({ content: `Event: **${name}**`, components: [row] });
        }
    });

    // Obsługa przycisków Add/Remove/Absent/List
    client.on("interactionCreate", async interaction => {
        if (!interaction.isButton()) return;
        if (!modChannel || interaction.channelId !== modChannel.id) return;

        const [action, eventId] = interaction.customId.split("_");
        const events = loadEvents();
        const event = events.find(e => e.id === eventId);
        if (!event) {
            await interaction.reply({ content: "Event not found.", ephemeral: true });
            return;
        }

        // Add participant
        if (action === "add") {
            await interaction.reply({ content: "Send the participant nick:", ephemeral: true });
            const collector = interaction.channel!.createMessageCollector({ filter: m => m.author.id === interaction.user.id, max: 1, time: 60_000 });
            collector.on("collect", m => {
                if (!event.participants.some(p => p.nick === m.content)) {
                    event.participants.push({ nick: m.content, present: true });
                    saveEvents(events);
                    m.reply(`Added **${m.content}** to event **${event.name}**.`);
                } else {
                    m.reply(`${m.content} is already in event **${event.name}**.`);
                }
            });
        }

        // Remove participant
        if (action === "remove") {
            await interaction.reply({ content: "Send the participant nick to remove:", ephemeral: true });
            const collector = interaction.channel!.createMessageCollector({ filter: m => m.author.id === interaction.user.id, max: 1, time: 60_000 });
            collector.on("collect", m => {
                event.participants = event.participants.filter(p => p.nick !== m.content);
                saveEvents(events);
                m.reply(`Removed **${m.content}** from event **${event.name}**.`);
            });
        }

        // Mark absent
        if (action === "absent") {
            await interaction.reply({ content: "Send the participant nick to mark as absent:", ephemeral: true });
            const collector = interaction.channel!.createMessageCollector({ filter: m => m.author.id === interaction.user.id, max: 1, time: 60_000 });
            collector.on("collect", m => {
                const p = event.participants.find(p => p.nick === m.content);
                if (p) {
                    p.present = false;
                    saveEvents(events);
                    m.reply(`Marked **${m.content}** as absent for event **${event.name}**.`);
                } else {
                    m.reply(`${m.content} not in event.`);
                }
            });
        }

        // List participants
        if (action === "list") {
            const present = event.participants.filter(p => p.present).map(p => p.nick);
            const absent = event.participants.filter(p => !p.present).map(p => p.nick);
            await interaction.reply({ content: `**${event.name}** Participants:\nPresent: ${present.join(", ") || "none"}\nAbsent: ${absent.join(", ") || "none"}`, ephemeral: true });
        }
    });
}