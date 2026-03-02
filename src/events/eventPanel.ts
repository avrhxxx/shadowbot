import { Client, Interaction, ButtonInteraction, ModalSubmitInteraction, TextChannel } from "discord.js";
import { createEvent, exportParticipants, calculateAttendance, findInactiveMembers, pinActiveEvent } from "./eventService";
import { loadEvents } from "./eventStorage";

export function initEventPanel(client: Client) {
    client.on("interactionCreate", async (interaction: Interaction) => {
        if (interaction.isButton()) {
            const customId = interaction.customId;

            // Export
            if (customId.startsWith("event_export_") && interaction.channel?.isTextBased()) {
                const eventId = customId.split("_")[2];
                const success = await exportParticipants(eventId, interaction.channel as TextChannel);
                await interaction.reply({ content: success ? "Exported." : "No participants.", ephemeral: true });
            }

            // Stats
            if (customId === "event_stats") {
                const data = loadEvents();
                const stats = calculateAttendance(data.events);
                const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 10);
                const text = sorted.map(([id, count], i) => `${i + 1}. <@${id}> - ${count}`).join("\n");
                await interaction.reply({ content: `🏆 Attendance Ranking\n\n${text || "No data."}`, ephemeral: true });
            }

            // Smart Suggestion
            if (customId === "event_suggestions") {
                const data = loadEvents();
                const inactive = findInactiveMembers(data.events);
                await interaction.reply({
                    content: `⚠️ Members missing last 3 events:\n\n${inactive.length ? inactive.map(x => `<@${x}>`).join("\n") : "None 🎉"}`,
                    ephemeral: true
                });
            }

            // Pin Active Event
            if (customId.startsWith("event_pin_") && interaction.channel?.isTextBased()) {
                const eventId = customId.split("_")[2];
                const data = loadEvents();
                const event = data.events.find(e => e.id === eventId);
                if (event) await pinActiveEvent(event, interaction.channel as TextChannel);
                await interaction.reply({ content: "Pinned active event.", ephemeral: true });
            }
        }

        if (interaction.isModalSubmit()) {
            const fields = (interaction as ModalSubmitInteraction).fields;
            if (interaction.customId === "event_modal") {
                const title = fields.getTextInputValue("event_title");
                const desc = fields.getTextInputValue("event_desc");
                const dateStr = fields.getTextInputValue("event_date");
                const timeStr = fields.getTextInputValue("event_time");

                const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
                const timeMatch = timeStr.match(/^(\d{2}):(\d{2})$/);
                if (!match || !timeMatch) return await interaction.reply({ content: "Invalid format.", ephemeral: true });

                const [, day, month, year] = match;
                const [, hour, minute] = timeMatch;

                const timestamp = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
                if (timestamp < Date.now()) return await interaction.reply({ content: "Event must be in the future.", ephemeral: true });

                createEvent(title, desc, timestamp, interaction.user.id);
                await interaction.reply({ content: `✅ Event created for <t:${Math.floor(timestamp / 1000)}:F>`, ephemeral: true });
            }
        }
    });
}