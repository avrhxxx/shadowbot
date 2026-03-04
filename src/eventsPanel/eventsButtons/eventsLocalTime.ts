// src/eventsPanel/eventsButtons/eventsLocalTime.ts
import {
  ButtonInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  EmbedBuilder,
  TextChannel
} from "discord.js";
import * as EventStorage from "../eventStorage";
import { countryToUTCOffset, formatUTCDate } from "../../utils/timeUtils";

/**
 * 🔹 KROK 1
 * Kliknięcie przycisku "Show in your local time"
 * -> sprawdza, czy użytkownik ma ustawiony offset
 * -> jeśli nie, pokazuje select menu krajów
 */
export async function handleShowLocalTimeButton(interaction: ButtonInteraction, event: any) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  const config = await EventStorage.getConfig(guildId);
  const userTimeConfig = config.userTimeConfig?.[userId];

  if (!userTimeConfig) {
    // brak ustawionego czasu → pokazujemy select menu z krajami
    const options = Object.entries(countryToUTCOffset).map(([country, offset]) => ({
      label: country,
      value: offset.toString(),
    }));

    const select = new StringSelectMenuBuilder()
      .setCustomId(`select_local_time_${event.id}`)
      .setPlaceholder("Select your country / region")
      .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    await interaction.reply({
      content: "Select your country/region to set your local time:",
      ephemeral: true,
      components: [row],
    });
    return;
  }

  // jeśli offset ustawiony → pokazujemy lokalny czas
  const utcDate = new Date(Date.UTC(event.year, event.month - 1, event.day, event.hour, event.minute));
  const offset = userTimeConfig.utcOffset;
  const localDate = new Date(utcDate.getTime() + offset * 60 * 60 * 1000);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const localDateStr = `${pad(localDate.getDate())}/${pad(localDate.getMonth() + 1)} ${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`;

  await interaction.reply({
    content: `Event **${event.name}** starts at your local time: ${localDateStr} (UTC${offset >= 0 ? "+" : ""}${offset})`,
    ephemeral: true,
  });
}

/**
 * 🔹 KROK 2
 * Obsługa select menu wyboru kraju
 * -> zapisuje offset użytkownika w storage
 */
export async function handleSetupLocalTimeSelect(interaction: StringSelectMenuInteraction) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  const utcOffset = parseInt(interaction.values[0], 10);

  const config = await EventStorage.getConfig(guildId);
  if (!config.userTimeConfig) config.userTimeConfig = {};
  config.userTimeConfig[userId] = { utcOffset };
  await EventStorage.saveConfig(guildId, config);

  await interaction.reply({
    content: `Your local time has been set! (UTC${utcOffset >= 0 ? "+" : ""}${utcOffset})`,
    ephemeral: true,
  });
}