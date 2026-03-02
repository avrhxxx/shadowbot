// src/events/eventPanel.ts
import {
    Client,
    TextChannel,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
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

// Pending selections per user
const pendingEvents = new Map<string, { day?: string; month?: string; userId: string }>();

export async function initEventPanel(client: Client) {

    client.on("interactionCreate", async (interaction: Interaction) => {

        if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

        const channel = interaction.channel as TextChannel;

        // =========================
        // BUTTON: Create Event (start)
        // =========================
        if (interaction.isButton() && interaction.customId === "event_create") {

            const dayOptions = Array.from({ length: 31 }, (_, i) => ({
                label: `${i + 1}`,
                value: `${i + 1}`
            }));

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

            // Row 1: Day
            const rowDay = new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`event_day_${interaction.user.id}`)
                        .setPlaceholder("Select Day")
                        .addOptions(dayOptions)
                );

            // Row 2: Month
            const rowMonth = new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`event_month_${interaction.user.id}`)
                        .setPlaceholder("Select Month")
                        .addOptions(monthOptions)
                );

            await interaction.reply({
                content: "Select day and month for the event:",
                components: [rowDay, rowMonth],
                ephemeral: true
            });

            return;
        }

        // =========================
        // SELECT MENU: Day / Month
        // =========================
        if (interaction.isStringSelectMenu()) {
            const [type, , userId] = interaction.customId.split("_");
            if (interaction.user.id !== userId) {
                await interaction.reply({ content: "This is not your event selection.", ephemeral: true });
                return;
            }

            if (!pendingEvents.has(userId)) {
                pendingEvents.set(userId, { userId });
            }

            const pending = pendingEvents.get(userId)!;

            if (type === "event") {
                if (interaction.customId.includes("day")) pending.day = interaction.values[0];
                if (interaction.customId.includes("month")) pending.month = interaction.values[0];
            }

            await interaction.deferUpdate();

            // Jeśli wybrano oba → pokaż modal
            if (pending.day && pending.month) {
                const modal = new ModalBuilder()
                    .setCustomId(`modal_event_${userId}`)
                    .setTitle("Event Details");

                const nameInput = new TextInputBuilder()
                    .setCustomId("event_name")
                    .setLabel("Event Name")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const timeInput = new TextInputBuilder()
                    .setCustomId("event_time")
                    .setLabel("Event Hour (HH:MM)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput)
                );

                await interaction.showModal(modal);
            }

            return;
        }

        // =========================
        // MODAL SUBMIT: Event Name + Hour
        // =========================
        if (interaction.isModalSubmit() && interaction.customId.startsWith("modal_event_")) {

            const userId = interaction.user.id;
            const pending = pendingEvents.get(userId);
            if (!pending || !pending.day || !pending.month) {
                await interaction.reply({ content: "Please select day and month first.", ephemeral: true });
                return;
            }

            const name = interaction.fields.getTextInputValue("event_name");
            const hourStr = interaction.fields.getTextInputValue("event_time"); // HH:MM

            const [hour, minute] = hourStr.split(":").map(Number);
            if (
                isNaN(hour) || isNaN(minute) ||
                hour < 0 || hour > 23 || minute < 0 || minute > 59
            ) {
                await interaction.reply({ content: "Invalid time format. Use HH:MM", ephemeral: true });
                return;
            }

            const now = new Date();
            let year = now.getFullYear();

            let timestamp = new Date(
                year,
                Number(pending.month) - 1,
                Number(pending.day),
                hour,
                minute
            ).getTime();

            // Jeśli data już minęła → ustaw kolejny rok
            if (timestamp < Date.now()) {
                year += 1;
                timestamp = new Date(
                    year,
                    Number(pending.month) - 1,
                    Number(pending.day),
                    hour,
                    minute
                ).getTime();
            }

            // Zapis do JSON
            const events = loadEvents();
            const id = Date.now().toString();

            events.push({
                id,
                name,
                timestamp,
                createdBy: userId
            });

            saveEvents(events);

            pendingEvents.delete(userId);

            // Wyślij panel eventu
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

            await interaction.reply({
                content: `✅ Event **${name}** created for <t:${Math.floor(timestamp / 1000)}:F>`,
                ephemeral: true
            });

            await channel.send({
                content: `📌 Event: **${name}**`,
                components: [row]
            });

            return;
        }

    });
}