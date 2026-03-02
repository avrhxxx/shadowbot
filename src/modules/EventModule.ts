// src/modules/EventModule.ts
import { Client, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Interaction, Message } from "discord.js";
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

// Wczytywanie eventów
function loadEvents(): EventData[] {
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    } catch {
        return [];
    }
}

// Zapis eventów
function saveEvents(events: EventData[]) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2), "utf-8");
}

// Tworzenie panelu głównego w kanale Moderation Panel
async function ensureModerationPanelChannel(client: Client): Promise<TextChannel> {
    const guild = client.guilds.cache.first();
    if (!guild) throw new Error("No guild found.");

    let channel = guild.channels.cache.find(c => c.name === "moderation-panel" && c.isTextBased()) as TextChannel;
    if (!channel) {
        channel = await guild.channels.create({
            name: "moderation-panel",
            type: 0, // GUILD_TEXT
            reason: "Moderation panel channel"
        }) as TextChannel;
    }

    return channel;
}

export async function initEventModule(client: Client) {
    const channel = await ensureModerationPanelChannel(client);

    // Tworzymy główny panel z przyciskiem Event
    const mainRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("event_panel").setLabel("Event").setStyle(ButtonStyle.Primary)
    );

    await channel.send({ content: "Moderation Panel", components: [mainRow] });

    client.on("interactionCreate", async (interaction: Interaction) => {
        if (!interaction.isButton()) return;

        // Panel Event: Create, List, Help
        if (interaction.customId === "event_panel") {
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId("event_create").setLabel("Create").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("event_list").setLabel("List").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("event_help").setLabel("Help").setStyle(ButtonStyle.Secondary)
            );
            await interaction.reply({ content: "Event Panel", components: [row], ephemeral: true });
        }

        // Tworzenie eventu
        if (interaction.customId === "event_create") {
            await interaction.reply({ content: "Send the event name and date (DD-MM_HH:MM), e.g., `Raid 15-03_20:00`", ephemeral: true });

            const filter = (m: Message) => m.author.id === interaction.user.id;
            const collector = interaction.channel?.createMessageCollector({ filter, time: 60_000, max: 1 });
            collector?.on("collect", m => {
                const [name, datetime] = m.content.trim().split(/\s+/);
                if (!name || !datetime) return m.channel.send("Invalid format.");

                const [day, monthHour] = datetime.split("-");
                const [month, hourMinute] = monthHour.split("_");
                const [hour, minute] = hourMinute.split(":");
                const date = new Date();
                date.setMonth(parseInt(month)-1, parseInt(day));
                date.setHours(parseInt(hour), parseInt(minute), 0, 0);

                const events = loadEvents();
                const id = `event_${Date.now()}`;
                events.push({ id, name, timestamp: date.getTime(), participants: [] });
                saveEvents(events);

                m.channel.send(`Event **${name}** created!`);
            });
        }

        // Lista eventów
        if (interaction.customId === "event_list") {
            const events = loadEvents();
            if (events.length === 0) return interaction.reply({ content: "No events found.", ephemeral: true });

            const rows: ActionRowBuilder<ButtonBuilder>[] = [];
            for (const ev of events) {
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId(`event_select_${ev.id}`).setLabel(ev.name).setStyle(ButtonStyle.Primary)
                );
                rows.push(row);
            }
            await interaction.reply({ content: "Select an event", components: rows, ephemeral: true });
        }

        // Po wybraniu konkretnego eventu
        if (interaction.customId.startsWith("event_select_")) {
            const eventId = interaction.customId.replace("event_select_", "");
            const events = loadEvents();
            const ev = events.find(e => e.id === eventId);
            if (!ev) return interaction.reply({ content: "Event not found.", ephemeral: true });

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId(`add_${eventId}`).setLabel("Add").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`remove_${eventId}`).setLabel("Remove").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`absent_${eventId}`).setLabel("Mark Absent").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`list_${eventId}`).setLabel("List").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`compare_${eventId}`).setLabel("Compare").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`help_${eventId}`).setLabel("Help").setStyle(ButtonStyle.Secondary)
            );
            await interaction.reply({ content: `Event **${ev.name}** actions:`, components: [row], ephemeral: true });
        }

        // Tutaj możesz dalej implementować obsługę add/remove/absent/list/compare/help po kliknięciu przycisków
    });
}