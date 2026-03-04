// src/eventsPanel/eventsButtons/eventsLocalTime.ts
import {
  ButtonInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ActionRowBuilder
} from "discord.js";
import * as UserTimeStorage from "../eventStorage";
import { countryToTimeZone } from "../../utils/timeZones";
import { formatLocalDateFromUTCWithTimeZone } from "../../utils/timeUtils";

/**
 * 🔹 KROK 1 – Kliknięcie przycisku "Show in your local time"
 */
export async function handleShowLocalTimeButton(interaction: ButtonInteraction, event: any) {
  const userId = interaction.user.id;
  const userTimeConfig = await UserTimeStorage.getUserTimeConfig();
  const userConfig = userTimeConfig[userId];

  if (!userConfig) {
    // brak strefy → select menu
    const options = Object.entries(countryToTimeZone).map(([country, tz]) => ({
      label: country,
      value: tz
    }));

    const select = new StringSelectMenuBuilder()
      .setCustomId(`select_local_time_${event.id}`)
      .setPlaceholder("Select your country / region")
      .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    const responseMethod = interaction.replied || interaction.deferred ? "followUp" : "reply";

    await interaction[responseMethod]({
      content: "Select your country/region to set your local time:",
      ephemeral: true,
      components: [row],
    });
    return;
  }

  // jeśli strefa ustawiona → pokaz lokalny czas
  const timeZone = userConfig.timeZone;

  // używamy roku z eventu, jeśli istnieje, w przeciwnym razie bieżącego roku UTC
  const year = event.year ?? new Date().getUTCFullYear();

  const localDateStr = formatLocalDateFromUTCWithTimeZone(
    event.day,
    event.month,
    year,
    event.hour,
    event.minute,
    timeZone
  );

  const responseMethod = interaction.replied || interaction.deferred ? "followUp" : "reply";

  await interaction[responseMethod]({
    content: `Event **${event.name}** starts at your local time: ${localDateStr} (${timeZone})`,
    ephemeral: true,
  });
}

/**
 * 🔹 KROK 2 – Select menu wyboru kraju
 */
export async function handleSetupLocalTimeSelect(interaction: StringSelectMenuInteraction) {
  const userId = interaction.user.id;
  const timeZone = interaction.values[0];

  const userTimeConfig = await UserTimeStorage.getUserTimeConfig();
  userTimeConfig[userId] = { timeZone };
  await UserTimeStorage.saveUserTimeConfig(userTimeConfig);

  const responseMethod = interaction.replied || interaction.deferred ? "followUp" : "reply";

  await interaction[responseMethod]({
    content: `Your time zone has been set! (${timeZone})`,
    ephemeral: true,
  });
}