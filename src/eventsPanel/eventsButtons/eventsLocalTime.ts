// src/eventsPanel/eventsButtons/eventsLocalTime.ts
import {
  ButtonInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ActionRowBuilder
} from "discord.js";
import * as UserTimeStorage from "../eventStorage/userLocalTime";
import { countryToUTCOffset, formatLocalDateFromUTCWithOffset } from "../../utils/timeUtils";

/**
 * 🔹 KROK 1
 * Kliknięcie przycisku "Show in your local time"
 * -> sprawdza, czy użytkownik ma ustawiony offset
 * -> jeśli nie, pokazuje select menu krajów
 */
export async function handleShowLocalTimeButton(interaction: ButtonInteraction, event: any) {
  const userId = interaction.user.id;
  const userTimeConfig = await UserTimeStorage.getUserTimeConfig();
  const userConfig = userTimeConfig[userId];

  if (!userConfig) {
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
  const offset = userConfig.utcOffset;
  const localDateStr = formatLocalDateFromUTCWithOffset(
    event.day,
    event.month,
    event.year,
    event.hour,
    event.minute,
    offset
  );

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
  const userId = interaction.user.id;
  const utcOffset = parseInt(interaction.values[0], 10);

  const userTimeConfig = await UserTimeStorage.getUserTimeConfig();
  userTimeConfig[userId] = { utcOffset };
  await UserTimeStorage.saveUserTimeConfig(userTimeConfig);

  await interaction.reply({
    content: `Your local time has been set! (UTC${utcOffset >= 0 ? "+" : ""}${utcOffset})`,
    ephemeral: true,
  });
}