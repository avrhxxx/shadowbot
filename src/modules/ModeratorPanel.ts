// src/modules/ModeratorPanel.ts
import { Client, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction, ButtonInteraction } from "discord.js";
import { initEventPanel } from "../events/eventPanel"; // inicjalizacja EventPanel

export async function initModeratorPanel(client: Client) {
  // Inicjalizacja EventPanel (samowystarczalny)
  initEventPanel(client);

  client.once("clientReady", async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    // Szukamy kanału lub tworzymy nowy
    let channel = guild.channels.cache.find(
      c => c.name === "moderation-panel" && c.isTextBased()
    ) as TextChannel;

    if (!channel) {
      channel = await guild.channels.create({
        name: "moderation-panel",
        type: 0, // GUILD_TEXT
      }) as TextChannel;
    }

    // Sprawdzamy, czy panel już istnieje
    const messages = await channel.messages.fetch({ limit: 20 });
    const existingPanel = messages.find(m =>
      m.author.id === client.user?.id &&
      m.content.includes("Moderator Panel")
    );

    if (!existingPanel) {
      // Tworzymy root panel moderatora (tylko 4 przyciski)
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("event_menu").setLabel("Event Menu").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("points_menu").setLabel("Points Menu").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("translator_menu").setLabel("Translator Menu").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("help_menu").setLabel("Help").setStyle(ButtonStyle.Success)
      );

      await channel.send({
        content: "📌 **Moderator Panel**",
        components: [row]
      });
    }
  });

  // Obsługa kliknięć w panelu
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    switch (interaction.customId) {
      case "event_menu":
        await renderEventPanel(interaction);
        break;

      case "points_menu":
        await interaction.reply({ content: "Points menu not implemented yet.", ephemeral: true });
        break;

      case "translator_menu":
        await interaction.reply({ content: "Translator menu not implemented yet.", ephemeral: true });
        break;

      case "help_menu":
        await interaction.reply({ content: "Help menu not implemented yet.", ephemeral: true });
        break;
    }
  });
}

// Funkcja wywołująca EventPanel (przekazuje przycisk dalej do eventPanel)
async function renderEventPanel(interaction: ButtonInteraction) {
  // Wywołujemy EventPanel i pozwalamy mu samemu wyrenderować swoje przyciski
  await interaction.reply({
    content: "📌 **Event Panel**",
    ephemeral: true
  });
}