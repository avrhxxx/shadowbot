// src/modules/ModeratorPanel.ts
import {
  Client,
  Interaction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

export function initModeratorPanel(client: Client) {
  // Listener dla root panelu (tylko w tym module)
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    switch (interaction.customId) {
      case "root_event_menu":
        await showEventMenu(interaction);
        break;
      case "root_points_menu":
        await showPointsMenu(interaction);
        break;
      case "root_translate_menu":
        await showTranslateMenu(interaction);
        break;
      case "root_help_menu":
        await showHelpMenu(interaction);
        break;
    }
  });
}

async function showEventMenu(interaction: Interaction) {
  const { content, components } = {
    content: "📌 **Event Menu**",
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("event_create")
          .setLabel("Create Event")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("event_list")
          .setLabel("List Events")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("event_cancel")
          .setLabel("Cancel Event")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("event_manual_reminder")
          .setLabel("Manual Reminder")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("event_download")
          .setLabel("Download Participants")
          .setStyle(ButtonStyle.Secondary)
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("event_settings")
          .setLabel("Settings")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("event_help")
          .setLabel("Help")
          .setStyle(ButtonStyle.Secondary)
      )
    ]
  };

  await interaction.reply({ content, components, ephemeral: true });
}

async function showPointsMenu(interaction: Interaction) {
  await interaction.reply({ content: "Points Menu – TODO", ephemeral: true });
}

async function showTranslateMenu(interaction: Interaction) {
  await interaction.reply({ content: "Translate Menu – TODO", ephemeral: true });
}

async function showHelpMenu(interaction: Interaction) {
  await interaction.reply({ content: "Help Menu – TODO", ephemeral: true });
}