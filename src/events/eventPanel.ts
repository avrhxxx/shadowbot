import {
  Client,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
} from "discord.js";

import {
  loadEvents,
  createEvent,
  addParticipant,
  removeParticipant,
  markAbsent,
  calculateAttendance,
  findInactiveMembers,
  pinActiveEvent,
  getUpcomingEvents,
} from "./eventService";

export async function initEventPanel(client: Client) {

  client.once("ready", async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    let channel = guild.channels.cache.find(
      c => c.name === "moderation-panel" && c.isTextBased()
    ) as TextChannel;

    if (!channel) {
      channel = await guild.channels.create({
        name: "moderation-panel",
        type: 0
      }) as TextChannel;
    }

    // Sprawdź czy panel już istnieje
    const messages = await channel.messages.fetch({ limit: 20 });
    const existingPanel = messages.find(m =>
      m.author.id === client.user?.id &&
      m.content.includes("Event Management Panel")
    );

    if (existingPanel) return;

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("event_list")
          .setLabel("List Events")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("event_stats")
          .setLabel("Stats")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("event_suggestions")
          .setLabel("Smart Suggestion")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("event_pin_active")
          .setLabel("Pin Active")
          .setStyle(ButtonStyle.Primary),
      );

    await channel.send({
      content: "📌 Event Management Panel",
      components: [row]
    });
  });

  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    const events = loadEvents();

    /* ===================== LIST EVENTS ===================== */
    if (interaction.customId === "event_list") {
      if (events.length === 0) {
        await interaction.reply({ content: "No events yet.", ephemeral: true });
        return;
      }

      const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
      const list = sorted
        .map(e => `• **${e.name}** (${new Date(e.timestamp).toLocaleString()})`)
        .join("\n");

      await interaction.reply({ content: `📅 Events:\n${list}`, ephemeral: true });
      return;
    }

    /* ===================== STATISTICS ===================== */
    if (interaction.customId === "event_stats") {
      const stats = calculateAttendance(events);
      const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 10);

      const text = sorted
        .map(([nick, count], i) => `${i + 1}. ${nick} - ${count}`)
        .join("\n") || "No data";

      await interaction.reply({ content: `🏆 Attendance Ranking\n\n${text}`, ephemeral: true });
      return;
    }

    /* ===================== SMART SUGGESTION ===================== */
    if (interaction.customId === "event_suggestions") {
      const inactive = findInactiveMembers(events);

      await interaction.reply({
        content:
          `⚠️ Members missing last 3 events:\n\n` +
          (inactive.length ? inactive.join("\n") : "None 🎉"),
        ephemeral: true
      });
      return;
    }

    /* ===================== PIN ACTIVE EVENT ===================== */
    if (interaction.customId === "event_pin_active") {
      const upcoming = getUpcomingEvents();
      if (upcoming.length === 0) {
        await interaction.reply({ content: "No upcoming events.", ephemeral: true });
        return;
      }

      const activeEvent = upcoming[0];
      const channel = interaction.channel as TextChannel;
      await pinActiveEvent(channel, activeEvent);

      await interaction.reply({
        content: `✅ Pinned active event: **${activeEvent.name}**`,
        ephemeral: true
      });
      return;
    }
  });
}