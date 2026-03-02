import {
  Client,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  StringSelectMenuBuilder,
} from "discord.js";

import {
  loadEvents,
  calculateAttendance,
  findInactiveMembers,
  pinActiveEvent,
  getUpcomingEvents,
  EventData,
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
        new ButtonBuilder()
          .setCustomId("event_export")
          .setLabel("Export Participants")
          .setStyle(ButtonStyle.Secondary)
      );

    await channel.send({
      content: "📌 Event Management Panel",
      components: [row]
    });
  });

  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    const events = loadEvents();

    // ===================== LIST EVENTS =====================
    if (interaction.isButton() && interaction.customId === "event_list") {
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

    // ===================== STATISTICS =====================
    if (interaction.isButton() && interaction.customId === "event_stats") {
      const stats = calculateAttendance(events);
      const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 10);

      const text = sorted
        .map(([nick, count], i) => `${i + 1}. ${nick} - ${count}`)
        .join("\n") || "No data";

      await interaction.reply({ content: `🏆 Attendance Ranking\n\n${text}`, ephemeral: true });
      return;
    }

    // ===================== SMART SUGGESTION =====================
    if (interaction.isButton() && interaction.customId === "event_suggestions") {
      const inactive = findInactiveMembers(events);

      await interaction.reply({
        content:
          `⚠️ Members missing last 3 events:\n\n` +
          (inactive.length ? inactive.join("\n") : "None 🎉"),
        ephemeral: true
      });
      return;
    }

    // ===================== PIN ACTIVE EVENT =====================
    if (interaction.isButton() && interaction.customId === "event_pin_active") {
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

    // ===================== EXPORT PARTICIPANTS =====================
    if (interaction.isButton() && interaction.customId === "event_export") {
      const upcoming = getUpcomingEvents();
      if (upcoming.length === 0) {
        await interaction.reply({ content: "No upcoming events.", ephemeral: true });
        return;
      }

      // Jeśli jest więcej niż jeden nadchodzący event, daj wybór dropdown
      if (upcoming.length === 1) {
        const activeEvent = upcoming[0];
        const channel = interaction.channel as TextChannel;
        const list = activeEvent.participants
          .map((p, i) => `${i + 1}. ${p.nick} (${p.present ? "✅" : "❌"})`)
          .join("\n");
        await channel.send(`📋 Participants for **${activeEvent.name}**\n\n${list}`);
        await interaction.reply({ content: "✅ Exported participants.", ephemeral: true });
        return;
      }

      // Dropdown select dla wielu eventów
      const options = upcoming.map(e => ({ label: e.name, value: e.id }));
      const row = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("select_export_event")
            .setPlaceholder("Select event to export")
            .addOptions(options)
        );

      await interaction.reply({
        content: "Select event to export participants:",
        components: [row],
        ephemeral: true
      });
      return;
    }

    // ===================== DROPDOWN EXPORT =====================
    if (interaction.isStringSelectMenu() && interaction.customId === "select_export_event") {
      const eventId = interaction.values[0];
      const event = events.find(e => e.id === eventId);
      if (!event) {
        await interaction.reply({ content: "Event not found.", ephemeral: true });
        return;
      }

      const list = event.participants
        .map((p, i) => `${i + 1}. ${p.nick} (${p.present ? "✅" : "❌"})`)
        .join("\n");

      const channel = interaction.channel as TextChannel;
      await channel.send(`📋 Participants for **${event.name}**\n\n${list}`);
      await interaction.reply({ content: "✅ Exported participants.", ephemeral: true });
      return;
    }
  });
}