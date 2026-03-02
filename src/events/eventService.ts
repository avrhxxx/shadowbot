// src/events/eventService.ts
import { Client, ButtonInteraction, ModalSubmitInteraction, TextChannel, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalBuilder } from "discord.js";
import { loadEvents, saveEvents, EventData, EventParticipant } from "./eventStorage";

export function initEventService(client: Client) {
    client.on("interactionCreate", async (interaction) => {

        // BUTTONS
        if (interaction.isButton()) {
            const events = loadEvents();

            // CREATE EVENT BUTTON
            if (interaction.customId === "event_create") {
                const modal = new ModalBuilder()
                    .setCustomId("modal_create_event")
                    .setTitle("Create Event")
                    .addComponents([
                        new ActionRowBuilder<TextInputBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId("event_name")
                                .setLabel("Event Name")
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder<TextInputBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId("event_date")
                                .setLabel("Date (DD-MM_HH:MM)")
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        )
                    ]);

                await interaction.showModal(modal);
            }
        }

        // MODAL SUBMIT
        if (interaction.isModalSubmit()) {
            if (interaction.customId === "modal_create_event") {
                const name = interaction.fields.getTextInputValue("event_name");
                const dateStr = interaction.fields.getTextInputValue("event_date");
                const match = dateStr.match(/^(\d{2})-(\d{2})_(\d{2}):(\d{2})$/);

                if (!match) {
                    await (interaction as ButtonInteraction | ModalSubmitInteraction)
                        .reply({ content: "Invalid format. Use DD-MM_HH:MM", ephemeral: true });
                    return;
                }

                const [, day, month, hour, minute] = match;
                const now = new Date();
                const timestamp = new Date(now.getFullYear(), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();

                const id = Date.now().toString();
                const events = loadEvents();
                events.push({ id, name, timestamp, participants: [] });
                saveEvents(events);

                await (interaction as ButtonInteraction | ModalSubmitInteraction)
                    .reply({ content: `✅ Event **${name}** created!`, ephemeral: true });
            }
        }
    });
}