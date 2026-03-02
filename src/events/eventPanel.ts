// src/events/eventPanel.ts
import {
    Client,
    Interaction,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
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
    participants: EventParticipant[];
    notifyChannelId?: string;
    notifyMinutesBefore?: number;
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
export async function initEventPanel(client: Client) {
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
                .setCustomId("event_notify")
                .setLabel("Notify X minutes before event (optional)")
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

        // ===== BUTTON: List Events =====
        if (interaction.isButton() && interaction.customId === "list_events") {
            const events = loadEvents();
            if (events.length === 0) {
                await interaction.reply({ content: "No events yet.", ephemeral: true });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle("Event List")
                .setDescription("Select an event:");

            const rows: ActionRowBuilder<ButtonBuilder>[] = [];

            events.forEach((e, i) => {
                const isPast = e.timestamp < Date.now();
                const row = new ActionRowBuilder<ButtonBuilder>();
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`event_${e.id}`)
                        .setLabel(e.name)
                        .setStyle(isPast ? ButtonStyle.Danger : ButtonStyle.Success)
                );
                if (!isPast) {
                    // 🔔 only for upcoming events
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`notify_${e.id}`)
                            .setLabel("🔔 Notify")
                            .setStyle(ButtonStyle.Primary)
                    );
                    // 🗑 remove only for upcoming events
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`delete_${e.id}`)
                            .setLabel("🗑 Delete")
                            .setStyle(ButtonStyle.Danger)
                    );
                }
                rows.push(row);
            });

            await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
            return;
        }

        // ===== BUTTON: Specific Event, Notify, Delete =====
        if (interaction.isButton()) {
            const parts = interaction.customId.split("_");
            const action = parts[0];
            const id = parts[1];
            const events = loadEvents();
            const event = events.find(e => e.id === id);

            if (!event) return await interaction.reply({ content: "Event not found.", ephemeral: true });

            if (action === "event") {
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

            if (action === "notify") {
                const channel = event.notifyChannelId
                    ? interaction.guild?.channels.cache.get(event.notifyChannelId) as TextChannel
                    : interaction.channel;
                if (channel) {
                    await channel.send(`Reminder: Event **${event.name}** starts at ${new Date(event.timestamp).toLocaleString()}`);
                    await interaction.reply({ content: "Notification sent.", ephemeral: true });
                } else {
                    await interaction.reply({ content: "Notification channel not found.", ephemeral: true });
                }
                return;
            }

            if (action === "delete") {
                const index = events.findIndex(ev => ev.id === id);
                if (index !== -1) {
                    events.splice(index, 1);
                    saveEvents(events);
                    await interaction.reply({ content: `✅ Event **${event.name}** deleted.`, ephemeral: true });
                }
                return;
            }

            // Add / Remove / Absent / List Participants buttons
            if (["add", "remove", "absent", "list"].includes(action)) {
                if (action === "list") {
                    const present = event.participants.filter(p => p.present).map(p => p.nick);
                    const absent = event.participants.filter(p => !p.present).map(p => p.nick);
                    await interaction.reply({
                        content: `**${event.name}**\n\n✅ Present: ${present.join(", ") || "none"}\n❌ Absent: ${absent.join(", ") || "none"}`,
                        ephemeral: true
                    });
                    return;
                } else {
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
            }
        }

        // ===== MODAL SUBMITS =====
        if (interaction.isModalSubmit()) {
            const cid = interaction.customId;

            // Create Event modal
            if (cid === "modal_create_event") {
                const name = interaction.fields.getTextInputValue("event_name");
                const day = Number(interaction.fields.getTextInputValue("event_day"));
                const month = Number(interaction.fields.getTextInputValue("event_month"));
                const hourStr = interaction.fields.getTextInputValue("event_hour");
                const notifyMinutes = Number(interaction.fields.getTextInputValue("event_notify")) || 0;

                const [hour, minute] = hourStr.split(":").map(Number);
                const now = new Date();
                const timestamp = new Date(now.getFullYear(), month - 1, day, hour, minute).getTime();

                const events = loadEvents();
                if (events.some(e => e.name === name)) {
                    await interaction.reply({ content: "❌ Event with this name already exists.", ephemeral: true });
                    return;
                }

                const newEvent: EventData = {
                    id: Date.now().toString(),
                    name,
                    timestamp,
                    participants: [],
                    notifyMinutesBefore: notifyMinutes,
                    notifyChannelId: interaction.channel?.id
                };

                events.push(newEvent);
                saveEvents(events);

                await interaction.reply({ content: `✅ Event **${name}** created for ${day}-${month} at ${hourStr}.`, ephemeral: true });
                return;
            }

            // Add / Remove / Absent Participants modal
            if (cid.startsWith("modal_")) {
                const parts = cid.split("_");
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
        }
    });
}