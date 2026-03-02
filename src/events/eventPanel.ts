// src/events/eventPanel.ts
import {
    Interaction,
    Client,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    EmbedBuilder,
    TextChannel
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
    reminderMinutes: number;
    notifyChannelId: string;
    participants: EventParticipant[];
}

const DATA_PATH = path.join(__dirname, "../data/events.json");

// ===== Utility functions =====
function loadEvents(): EventData[] {
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    } catch {
        return [];
    }
}

function saveEvents(events: EventData[]) {
    // ensure folder exists
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2), "utf-8");
}

// ===== Event Panel embed =====
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

// ===== Main workflow =====
export async function initEventPanel(client: Client) {
    client.on("interactionCreate", async (interaction: Interaction) => {

        // ===== BUTTON: Create Event =====
        if (interaction.isButton() && interaction.customId === "create_event") {
            const modal = new ModalBuilder()
                .setCustomId("modal_create_event")
                .setTitle("Create New Event");

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

            const reminderInput = new TextInputBuilder()
                .setCustomId("event_reminder")
                .setLabel("Reminder (minutes before)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(hourInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(reminderInput)
            );

            await interaction.showModal(modal);
            return;
        }

        // ===== MODAL SUBMIT: Create Event =====
        if (interaction.isModalSubmit() && interaction.customId === "modal_create_event") {
            const name = interaction.fields.getTextInputValue("event_name").trim();
            const day = parseInt(interaction.fields.getTextInputValue("event_day"));
            const month = parseInt(interaction.fields.getTextInputValue("event_month"));
            const hourStr = interaction.fields.getTextInputValue("event_hour");
            const reminderMinutes = parseInt(interaction.fields.getTextInputValue("event_reminder"));

            const [hour, minute] = hourStr.split(":").map(Number);
            const now = new Date();
            const timestamp = new Date(now.getFullYear(), month - 1, day, hour, minute).getTime();

            const events = loadEvents();
            if (events.some(e => e.name.toLowerCase() === name.toLowerCase())) {
                await interaction.reply({ content: `❌ Event with name "${name}" already exists.`, ephemeral: true });
                return;
            }

            // ===== Channel select for notifications =====
            const guild = interaction.guild;
            if (!guild) return;

            const channelOptions = guild.channels.cache
                .filter(c => c.isTextBased())
                .map(c => ({ label: c.name, value: c.id }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`select_notify_channel_${name}_${timestamp}_${reminderMinutes}`)
                .setPlaceholder("Select channel for notifications")
                .addOptions(channelOptions);

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

            await interaction.reply({ content: "Select channel for notifications:", components: [row], ephemeral: true });
            return;
        }

        // ===== SELECT MENU: Choose notification channel =====
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith("select_notify_channel_")) {
            const [_, __, name, timestampStr, reminderStr] = interaction.customId.split("_");
            const notifyChannelId = interaction.values[0];
            const timestamp = parseInt(timestampStr);
            const reminderMinutes = parseInt(reminderStr);

            const events = loadEvents();
            const id = Date.now().toString();

            events.push({
                id,
                name,
                timestamp,
                reminderMinutes,
                notifyChannelId,
                participants: []
            });
            saveEvents(events);

            await interaction.update({ content: `✅ Event **${name}** created!`, components: [] });
            return;
        }

        // ===== BUTTON: List Events =====
        if (interaction.isButton() && interaction.customId === "list_events") {
            const events = loadEvents();
            if (events.length === 0) {
                await interaction.reply({ content: "No events yet.", ephemeral: true });
                return;
            }

            const embed = new EmbedBuilder().setTitle("Event List").setDescription("Select an event:");

            const row = new ActionRowBuilder<ButtonBuilder>();
            events.forEach(e => {
                const isPast = e.timestamp < Date.now();
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`event_${e.id}`)
                        .setLabel(e.name)
                        .setStyle(isPast ? ButtonStyle.Danger : ButtonStyle.Success)
                );
            });

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            return;
        }

        // ===== BUTTONS: Specific Event Actions =====
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
                        .setStyle(ButtonStyle.Success),
                    ...(event.timestamp > Date.now()
                        ? [new ButtonBuilder()
                            .setCustomId(`notify_${id}`)
                            .setLabel("🔔 Send Reminder")
                            .setStyle(ButtonStyle.Primary)]
                        : [])
                );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            return;
        }

        // ===== PARTICIPANTS: Add / Remove / Absent / List =====
        if (interaction.isButton()) {
            const parts = interaction.customId.split("_");
            const action = parts[0];
            const id = parts[1];

            if (!["add","remove","absent","list","notify"].includes(action)) return;

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

            if (action === "notify") {
                const channel = interaction.guild?.channels.cache.get(event.notifyChannelId) as TextChannel;
                if (channel) {
                    await channel.send(`🔔 Reminder: Event **${event.name}** starts in ${event.reminderMinutes} minutes!`);
                    await interaction.reply({ content: "Reminder sent!", ephemeral: true });
                } else {
                    await interaction.reply({ content: "Channel not found.", ephemeral: true });
                }
                return;
            }
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