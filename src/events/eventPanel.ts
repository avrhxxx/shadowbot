import {
  Client,
  Interaction,
  ButtonInteraction,
  ModalSubmitInteraction,
  CacheType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  TextChannel,
  StringSelectMenuBuilder,
} from "discord.js";

import { eventService } from "./eventService";
import { eventStorage } from "./eventStorage";

export function initEventPanel(client: Client) {
  client.on("interactionCreate", async (interaction: Interaction<CacheType>) => {
    if (interaction.isButton()) await handleButton(interaction);
    if (interaction.isModalSubmit()) await handleModal(interaction);
    if (interaction.isStringSelectMenu()) await handleSelect(interaction);
  });
}

async function handleButton(interaction: ButtonInteraction) {
  switch (interaction.customId) {
    case "create_event":
      return showCreateModal(interaction);
    case "list_events":
      return showList(interaction);
    case "cancel_event":
      return showCancelMenu(interaction);
    case "manual_reminder":
      return manualReminder(interaction);
    case "settings_channel":
      return showChannelSelect(interaction);
  }
}

async function showCreateModal(interaction: ButtonInteraction) {
  const modal = new ModalBuilder()
    .setCustomId("create_event_modal")
    .setTitle("Create Event");

  const title = new TextInputBuilder()
    .setCustomId("title")
    .setLabel("Title")
    .setStyle(TextInputStyle.Short);

  const description = new TextInputBuilder()
    .setCustomId("description")
    .setLabel("Description")
    .setStyle(TextInputStyle.Paragraph);

  const timestamp = new TextInputBuilder()
    .setCustomId("timestamp")
    .setLabel("Unix Timestamp (ms)")
    .setStyle(TextInputStyle.Short);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(title),
    new ActionRowBuilder<TextInputBuilder>().addComponents(description),
    new ActionRowBuilder<TextInputBuilder>().addComponents(timestamp)
  );

  await interaction.showModal(modal);
}

async function handleModal(interaction: ModalSubmitInteraction) {
  if (interaction.customId !== "create_event_modal") return;

  const title = interaction.fields.getTextInputValue("title");
  const description = interaction.fields.getTextInputValue("description");
  const timestamp = Number(
    interaction.fields.getTextInputValue("timestamp")
  );

  const config = eventStorage.getConfig();
  if (!config.defaultChannelId) {
    return interaction.reply({
      content: "Default channel not set. Use ⚙️ first.",
      ephemeral: true,
    });
  }

  eventService.createEvent({
    title,
    description,
    timestamp,
    channelId: config.defaultChannelId,
  });

  await interaction.reply({
    content: `Event **${title}** created.`,
    ephemeral: true,
  });
}

async function showList(interaction: ButtonInteraction) {
  const events = eventService.listAllEvents();

  if (!events.length) {
    return interaction.reply({
      content: "No events found.",
      ephemeral: true,
    });
  }

  const formatted = events
    .map(
      (e) =>
        `• ${e.title} - <t:${Math.floor(
          e.timestamp / 1000
        )}:F> ${e.cancelled ? "(CANCELLED)" : ""}`
    )
    .join("\n");

  await interaction.reply({
    content: formatted,
    ephemeral: true,
  });
}

async function showCancelMenu(interaction: ButtonInteraction) {
  const events = eventService.listUpcomingEvents();

  if (!events.length) {
    return interaction.reply({
      content: "No active events.",
      ephemeral: true,
    });
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId("cancel_select")
    .setPlaceholder("Select event to cancel")
    .addOptions(
      events.map((e) => ({
        label: e.title,
        value: e.id,
      }))
    );

  await interaction.reply({
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
    ],
    ephemeral: true,
  });
}

async function handleSelect(interaction: any) {
  if (interaction.customId === "cancel_select") {
    const id = interaction.values[0];
    eventService.cancelEvent(id);

    await interaction.reply({
      content: "Event cancelled.",
      ephemeral: true,
    });
  }

  if (interaction.customId === "channel_select") {
    const channelId = interaction.values[0];
    eventStorage.setDefaultChannel(channelId);

    await interaction.reply({
      content: "Default channel updated.",
      ephemeral: true,
    });
  }
}

async function showChannelSelect(interaction: ButtonInteraction) {
  if (!interaction.guild) return;

  const channels = interaction.guild.channels.cache
    .filter((c) => c.isTextBased())
    .map((c) => ({
      label: c.name,
      value: c.id,
    }));

  const select = new StringSelectMenuBuilder()
    .setCustomId("channel_select")
    .setPlaceholder("Select notification channel")
    .addOptions(channels);

  await interaction.reply({
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
    ],
    ephemeral: true,
  });
}

async function manualReminder(interaction: ButtonInteraction) {
  const events = eventService.listUpcomingEvents();
  const config = eventStorage.getConfig();

  if (!config.defaultChannelId)
    return interaction.reply({
      content: "No default channel set.",
      ephemeral: true,
    });

  const channel = interaction.guild?.channels.cache.get(
    config.defaultChannelId
  ) as TextChannel;

  if (!channel)
    return interaction.reply({
      content: "Channel not found.",
      ephemeral: true,
    });

  for (const event of events) {
    await channel.send(
      `Reminder: **${event.title}** at <t:${Math.floor(
        event.timestamp / 1000
      )}:F>`
    );
  }

  await interaction.reply({
    content: "Reminders sent.",
    ephemeral: true,
  });
}