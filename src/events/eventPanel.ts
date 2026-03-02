import {
    Interaction,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ChannelType
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
    notifyChannelId?: string;
    participants: EventParticipant[];
}

const DATA_PATH = path.join(__dirname, "../data/events.json");

// ===== Load / Save =====
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

// ===== Event Panel Embed =====
export async function handleEventButton(interaction: Interaction) {
    if (!interaction.isButton()) return;

    const embed = new EmbedBuilder()
        .setTitle("📌 Event Panel")
        .setDescription("Select an action:");

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("create_event")
            .setLabel("Create Event")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("list_events")
            .setLabel("List Events")
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

// ===== Init Panel =====
export async function initEventPanel(client: any) {
    client.on("interactionCreate", async (interaction: Interaction) => {

        // ===== Create Event Button =====
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

            const timeInput = new TextInputBuilder()
                .setCustomId("event_time")
                .setLabel("Hour:Minute (HH:MM)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const reminderInput = new TextInputBuilder()
                .setCustomId("event_reminder")
                .setLabel("Reminder Minutes Before Event")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(reminderInput)
            );

            await interaction.showModal(modal);
            return;
        }

        // ===== List Events Button =====
        if (interaction.isButton() && interaction.customId === "list_events") {
            const events = loadEvents();
            if (events.length === 0) {
                await interaction.reply({ content: "No events yet.", ephemeral: true });
                return;
            }

            const embed = new EmbedBuilder().setTitle("Event List").setDescription("Select an event:");

            const rows: ActionRowBuilder<ButtonBuilder>[] = [];
            for (const event of events) {
                const isPast = event.timestamp < Date.now();
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`event_${event.id}`)
                        .setLabel(event.name)
                        .setStyle(isPast ? ButtonStyle.Danger : ButtonStyle.Success),
                    ...(!isPast && event.notifyChannelId
                        ? [new ButtonBuilder()
                            .setCustomId(`manualnotify_${event.id}`)
                            .setLabel("🔔")
                            .setStyle(ButtonStyle.Primary)]
                        : [])
                );
                rows.push(row);
            }

            await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
            return;
        }

        // ===== Event Specific Button =====
        if (interaction.isButton() && interaction.customId.startsWith("event_")) {
            const id = interaction.customId.split("_")[1];
            const events = loadEvents();
            const event = events.find(e => e.id === id);
            if (!event) return await interaction.reply({ content: "Event not found.", ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle(`Event: ${event.name}`)
                .setDescription(`Date: ${new Date(event.timestamp).toLocaleString()}`);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

            if (event.notifyChannelId && event.timestamp > Date.now()) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`manualnotify_${id}`)
                        .setLabel("🔔")
                        .setStyle(ButtonStyle.Primary)
                );
            }

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            return;
        }

        // ===== Add / Remove / Absent / List Participants =====
        if (interaction.isButton()) {
            const parts = interaction.customId.split("_");
            const action = parts[0];
            const id = parts[1];

            if (!["add","remove","absent","list","manualnotify"].includes(action)) return;

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

            if (action === "manualnotify") {
                const channel = await client.channels.fetch(event.notifyChannelId!);
                if (channel && channel.isTextBased()) {
                    await (channel as any).send(`🔔 Reminder: Event **${event.name}** starts in ${event.reminderMinutes} minutes!`);
                }
                await interaction.reply({ content: "Notification sent.", ephemeral: true });
                return;
            }
        }

        // ===== Modal Submit =====
        if (interaction.isModalSubmit() && interaction.customId.startsWith("modal_create_event")) {
            const name = interaction.fields.getTextInputValue("event_name");
            const day = parseInt(interaction.fields.getTextInputValue("event_day"));
            const month = parseInt(interaction.fields.getTextInputValue("event_month"));
            const [hourStr, minuteStr] = interaction.fields.getTextInputValue("event_time").split(":");
            const hour = parseInt(hourStr);
            const minute = parseInt(minuteStr);
            const reminderMinutes = parseInt(interaction.fields.getTextInputValue("event_reminder"));

            const timestamp = new Date(new Date().getFullYear(), month-1, day, hour, minute).getTime();

            // Temporarily store in memory before channel select
            (client as any).pendingEvent = {
                id: `${Date.now()}`,
                name,
                timestamp,
                reminderMinutes,
                participants: [] as EventParticipant[]
            };

            // Ask for channel select
            const channels = interaction.guild!.channels.cache
                .filter(c => c.isTextBased())
                .map(c => ({ label: c.name, value: c.id }));

            const select = new StringSelectMenuBuilder()
                .setCustomId("select_notify_channel")
                .setPlaceholder("Select notification channel")
                .addOptions(channels.map(c => new StringSelectMenuOptionBuilder().setLabel(c.label).setValue(c.value)));

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

            await interaction.reply({ content: "Select channel for event notifications:", components: [row], ephemeral: true });
            return;
        }

        // ===== Channel Select =====
        if (interaction.isStringSelectMenu() && interaction.customId === "select_notify_channel") {
            const pending: EventData = (client as any).pendingEvent;
            if (!pending) return await interaction.reply({ content: "No event pending.", ephemeral: true });

            pending.notifyChannelId = interaction.values[0];

            // Save event now
            const events = loadEvents();
            events.push(pending);
            saveEvents(events);

            delete (client as any).pendingEvent;

            await interaction.reply({ content: `✅ Event **${pending.name}** created!`, ephemeral: true });
            return;
        }

        // ===== Modal Submit for Participants =====
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