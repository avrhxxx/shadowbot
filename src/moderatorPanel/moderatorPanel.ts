// src/moderatorPanel/moderatorPanel.ts
import {
  Client,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction
} from "discord.js";

import { renderEventPanel } from "../eventsPanel/eventPanel"; // EventPanel renderer
// import { handlePointsMenu } from "./moderatorButtons/pointsMenu"; // placeholder
// import { handleTranslateMenu } from "./moderatorButtons/translateMenu"; // placeholder
import { handleModeratorHelp } from "./moderatorButtons/moderatorHelp";
import { handleEventMenu } from "./moderatorButtons/eventMenu";

export async function initModeratorPanel(client: Client) {
  if (!client.user) return;

  // Iteracja po guildach z await, żeby uniknąć podwójnego tworzenia paneli
  for (const guild of client.guilds.cache.values()) {
    let modChannel = guild.channels.cache.find(
      (c) =>
        c.type === 0 && // GUILD_TEXT
        c.name === "moderator-panel"
    ) as TextChannel;

    if (!modChannel) {
      modChannel = await guild.channels.create({
        name: "moderator-panel",
        type: 0, // GUILD_TEXT
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: ["ViewChannel"]
          }
        ]
      });
    }

    // --- NOWOŚĆ: wysyłamy wiadomość z formatami dat ---
    await modChannel.send(`

📅 Accepted Date & Time Formats
Please enter dates and times in one of the following formats:

🕰 Date + Time:
  DD.MM HH:MM   → 18.07 20:30
  DD/MM HH:MM   → 18/07 20:30
  DD-MM HH:MM   → 18-07 20:30
  DD.MM HHMM    → 18.07 2030
  DD/MM HHMM    → 18/07 2030
  DD-MM HHMM    → 18-07 2030
  DDMM HHMM     → 1807 2030
  DDMMHHMM      → 18072030

📆 Year only:
  YYYY          → 2026

Tip: No need for magic wands — just type it straight! ✨

    `);

    // Render root hub w tym kanale
    await renderModeratorHub(modChannel);
  }

  // Globalny listener na przyciski ModeratorPanel
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    switch (interaction.customId) {
      case "moderator_event_menu":
        await handleEventMenu(interaction);
        break;

      case "moderator_points_menu":
        // await handlePointsMenu(interaction); // placeholder
        await interaction.reply({
          content: "Points Menu – TODO",
          ephemeral: true
        });
        break;

      case "moderator_translate_menu":
        // await handleTranslateMenu(interaction); // placeholder
        await interaction.reply({
          content: "Translate Menu – TODO",
          ephemeral: true
        });
        break;

      case "moderator_help":
        await handleModeratorHelp(interaction);
        break;
    }
  });
}

// Funkcja renderująca root panel / hub w kanale moderator-panel
export async function renderModeratorHub(channel: TextChannel) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("moderator_event_menu")
      .setLabel("Event Menu")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("moderator_points_menu")
      .setLabel("Points Menu")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("moderator_translate_menu")
      .setLabel("Translate Menu")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("moderator_help")
      .setLabel("Help")
      .setStyle(ButtonStyle.Secondary)
  );

  await channel.send({
    content: "📌 **Moderator Panel**",
    components: [row]
  });
}