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

export async function initEventPanel(client: Client) {
    client.once("clientReady", async () => {
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

        // Sprawdzenie czy panel już istnieje
        const messages = await channel.messages.fetch({ limit: 20 });
        const existingPanel = messages.find(m =>
            m.author.id === client.user?.id &&
            m.content.includes("Event Management Panel")
        );
        if (existingPanel) return;

        // 🔹 Panel z jednym przyciskiem
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("event_create")
                    .setLabel("Event")
                    .setStyle(ButtonStyle.Primary)
            );

        await channel.send({
            content: "📌 Event Management Panel",
            components: [row]
        });
    });

    client.on("interactionCreate", async (interaction: Interaction) => {

        // BUTTON "Event"
        if (interaction.isButton() && interaction.customId === "event_create") {

            // 🔹 Select menu z dniem
            const dayMenu = new StringSelectMenuBuilder()
                .setCustomId("select_day")
                .setPlaceholder("Select day");

            for (let i = 1; i <= 31; i++) {
                dayMenu.addOptions({
                    label: `${i}`,
                    value: `${i}` // musi być string
                });
            }

            await interaction.reply({
                content: "Select day:",
                components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(dayMenu)],
                ephemeral: true
            });
            return;
        }

        // SELECT DAY
        if (interaction.isStringSelectMenu() && interaction.customId === "select_day") {
            const day = interaction.values[0];

            // 🔹 Select menu z miesiącem
            const monthMenu = new StringSelectMenuBuilder()
                .setCustomId(`select_month_${day}`)
                .setPlaceholder("Select month");

            const months = [
                "January","February","March","April","May","June",
                "July","August","September","October","November","December"
            ];

            months.forEach((m, idx) => {
                monthMenu.addOptions({ label: m, value: `${idx + 1}` }); // string!
            });

            await interaction.update({
                content: `Selected day: ${day}. Now select month:`,
                components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(monthMenu)]
            });
            return;
        }

        // SELECT MONTH
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith("select_month_")) {
            const day = interaction.customId.split("_")[2];
            const month = interaction.values[0];

            // 🔹 Modal do wpisania nazwy eventu i godziny
            const modal = new ModalBuilder()
                .setCustomId(`modal_create_event_${day}_${month}`)
                .setTitle("Create Event");

            const nameInput = new TextInputBuilder()
                .setCustomId("event_name")
                .setLabel("Event Name")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const hourInput = new TextInputBuilder()
                .setCustomId("event_hour")
                .setLabel("Hour (HH:MM)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(hourInput)
            );

            await interaction.showModal(modal);
            return;
        }

        // MODAL SUBMIT
        if (interaction.isModalSubmit() && interaction.customId.startsWith("modal_create_event_")) {
            const parts = interaction.customId.split("_");
            const day = Number(parts[3]);
            const month = Number(parts[4]);

            const name = interaction.fields.getTextInputValue("event_name");
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

    });
}