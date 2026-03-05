// src/moderatorPanel/moderatorPanel.ts
export async function initModeratorPanel(client: Client) {
  if (!client.user) return;

  client.guilds.cache.forEach(async (guild) => {
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

    // --- NOWOŚĆ: wysyłamy wiadomość z datami i formatami ---
    await modChannel.send(`
\`\`\`
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
\`\`\`
    `);

    // Render root hub w tym kanale (panel)
    await renderModeratorHub(modChannel);
  });

  // Globalny listener na przyciski ModeratorPanel (bez zmian)
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    switch (interaction.customId) {
      case "moderator_event_menu":
        await handleEventMenu(interaction);
        break;

      case "moderator_points_menu":
        await interaction.reply({
          content: "Points Menu – TODO",
          ephemeral: true
        });
        break;

      case "moderator_translate_menu":
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