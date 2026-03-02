// src/events/eventPanel.ts
import { Client, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, ModalSubmitInteraction, StringSelectMenuBuilder } from "discord.js";
import { loadEvents, EventData } from "./eventStorage";

export function initEventPanel(client: Client) {
    client.once("ready", async () => {
        const guild = client.guilds.cache.first();
        if (!guild) return;

        let channel = guild.channels.cache.find(
            c => c.name === "moderation-panel" && c.isTextBased()
        ) as TextChannel;

        if (!channel) {
            channel = await guild.channels.create({ name: "moderation-panel", type: 0 }) as TextChannel;
        }

        const messages = await channel.messages.fetch({ limit: 20 });
        const existingPanel = messages.find(m => m.author.id === client.user?.id && m.content.includes("Event Management Panel"));
        if (existingPanel) return;

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId("event_create").setLabel("Create Event").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("event_list").setLabel("List Events").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("event_help").setLabel("Help").setStyle(ButtonStyle.Success)
        );

        await channel.send({ content: "📌 Event Management Panel", components: [row] });
    });

    client.on("interactionCreate", async (interaction) => {
        if (interaction.isButton()) {
            const events = loadEvents();
            const id = interaction.customId.split("_")[1];
            const action = interaction.customId.split("_")[0];

            if (action === "list") {
                const event = events.find(e => e.id === id);
                if (!event) return;

                const present = event.participants.filter(p => p.present).map(p => p.nick);
                const absent = event.participants.filter(p => !p.present).map(p => p.nick);

                await (interaction as ButtonInteraction | ModalSubmitInteraction).reply({
                    content: `**${event.name}**\n✅ Present: ${present.join(", ") || "none"}\n❌ Absent: ${absent.join(", ") || "none"}`,
                    ephemeral: true
                });
            }
        }
    });
}