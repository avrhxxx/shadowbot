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
    Interaction
} from "discord.js";
import fs from "fs";
import path from "path";

interface EventData {
    id: string;
    name: string;
    timestamp: number;
    createdBy: string;
}

const DATA_PATH = path.join(__dirname, "../data/events.json");

// ----------------- STORAGE -----------------
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

// ----------------- PANEL CHANNEL -----------------
async function getOrCreatePanelChannel(guild: any, name = "moderation-panel"): Promise<TextChannel> {
    let channel = guild.channels.cache.find(
        (c: any) => c.name === name && c.type === 0
    ) as TextChannel | undefined;

    if (channel) return channel;

    channel = await guild.channels.create({
        name,
        type: 0 // ChannelType.GuildText
    }) as TextChannel;

    return channel;
}

// ----------------- INIT -----------------
export async function initEventPanel(client: Client) {

    client.once("ready", async () => {
        const guild = client.guilds.cache.first();
        if (!guild) return;

        const channel = await getOrCreatePanelChannel(guild);

        // Sprawdź czy panel już istnieje
        const messages = await channel.messages.fetch({ limit: 20 });
        const existingPanel = messages.find(m =>
            m.author.id === client.user?.id &&
            m.content.includes("Event Management Panel")
        );
        if (existingPanel) return;

        // Główny panel
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("event_create_day")
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

        const panel = await channel.send({
            content: "📌 Event Management Panel",
            components: [row]
        });

        await panel.pin();
    });

    // ----------------- INTERACTIONS -----------------
    client.on("interactionCreate", async (interaction: Interaction) => {

        // ---------- BUTTONS ----------
        if (interaction.isButton()) {

            const events = loadEvents();

            // 1️⃣ Create Event – wybór dnia (dropdown)
            if (interaction.customId === "event_create_day") {

                const dayOptions = Array.from({ length: 31 }, (_, i) => ({
                    label: `${i + 1}`,
                    value: `${i + 1}`
                }));

                const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`event_select_day_${interaction.user.id}`)
                            .setPlaceholder("Select Day")
                            .addOptions(dayOptions)
                    );

                await interaction.reply({ content: "Select day:", components: [row], ephemeral: true });
                return;
            }

            // 2️⃣ List Events
            if (interaction.customId === "event_list") {
                if (events.length === 0) {
                    await interaction.reply({ content: "No events yet.", ephemeral: true });
                    return;
                }

                const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
                const list = sorted
                    .map(e => `• **${e.name}** (${new Date(e.timestamp).toLocaleString()})`)
                    .join("\n");

                await interaction.reply({ content: `📅 Events:\n${list}`, ephemeral: true });
                return;
            }

            // 3️⃣ Help
            if (interaction.customId === "event_help") {
                await interaction.reply({
                    content: `**Event Panel Help**\n\n` +
                        `• Create Event → Step by step creation\n` +
                        `• List Events → Show all events\n` +
                        `• Add/Remove/Mark Absent → Manage participants`,
                    ephemeral: true
                });
                return;
            }
        }

        // ---------- SELECT MENUS ----------
        if (interaction.isStringSelectMenu()) {
            const parts = interaction.customId.split("_");

            // Wybór dnia
            if (parts[0] === "event" && parts[1] === "select" && parts[2] === "day") {
                const userId = parts[3];
                if (interaction.user.id !== userId) return;

                const day = Number(interaction.values[0]);
                // Teraz wyskakuje SELECT MIESIĄCA
                const monthOptions = [
                    { label: "January", value: "1" },
                    { label: "February", value: "2" },
                    { label: "March", value: "3" },
                    { label: "April", value: "4" },
                    { label: "May", value: "5" },
                    { label: "June", value: "6" },
                    { label: "July", value: "7" },
                    { label: "August", value: "8" },
                    { label: "September", value: "9" },
                    { label: "October", value: "10" },
                    { label: "November", value: "11" },
                    { label: "December", value: "12" }
                ];

                const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`event_select_month_${interaction.user.id}_${day}`)
                            .setPlaceholder("Select Month")
                            .addOptions(monthOptions)
                    );

                await interaction.update({ content: "Select month:", components: [row] });
                return;
            }

            // Wybór miesiąca → otwieramy modal
            if (parts[0] === "event" && parts[1] === "select" && parts[2] === "month") {
                const userId = parts[3];
                const day = Number(parts[4]);
                if (interaction.user.id !== userId) return;

                const month = Number(interaction.values[0]);

                // Modal: wpisanie nazwy wydarzenia i godziny
                const modal = new ModalBuilder()
                    .setCustomId(`modal_create_event_${interaction.user.id}_${day}_${month}`)
                    .setTitle("Create Event");

                const nameInput = new TextInputBuilder()
                    .setCustomId("event_name")
                    .setLabel("Event Name")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const timeInput = new TextInputBuilder()
                    .setCustomId("event_time")
                    .setLabel("Time (HH:MM)")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("20:00")
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput)
                );

                await interaction.showModal(modal);
                return;
            }
        }

        // ---------- MODALS ----------
        if (interaction.isModalSubmit()) {
            const parts = interaction.customId.split("_");

            if (parts[0] === "modal" && parts[1] === "create" && parts[2] === "event") {
                const userId = parts[3];
                const day = Number(parts[4]);
                const month = Number(parts[5]);

                if (interaction.user.id !== userId) return;

                const name = interaction.fields.getTextInputValue("event_name");
                const timeStr = interaction.fields.getTextInputValue("event_time");

                const [hour, minute] = timeStr.split(":").map(Number);

                const now = new Date();
                let year = now.getFullYear();

                let timestamp = new Date(year, month - 1, day, hour, minute).getTime();
                if (timestamp < Date.now()) timestamp += 365 * 24 * 60 * 60 * 1000; // next year if past

                const events = loadEvents();
                const id = Date.now().toString();
                events.push({ id, name, timestamp, createdBy: userId });
                saveEvents(events);

                await interaction.reply({ content: `✅ Event **${name}** created!`, ephemeral: true });

                // Wyślij panel eventu z przyciskami
                const channel = interaction.channel as TextChannel;
                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`add_${id}`).setLabel("Add").setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId(`remove_${id}`).setLabel("Remove").setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId(`absent_${id}`).setLabel("Mark Absent").setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`list_${id}`).setLabel("List").setStyle(ButtonStyle.Success)
                    );

                await channel.send({ content: `📌 Event: **${name}**`, components: [row] });
            }
        }
    });
}