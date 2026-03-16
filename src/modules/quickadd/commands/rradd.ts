// src/modules/quickadd/commands/rradd.ts

import { CommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { ReservoirRaidParser } from "../parsers/ReservoirRaidParser";

export async function rrAddCommand(interaction: CommandInteraction) {
  const args = interaction.options.getString("date");
  if (!args) {
    await interaction.reply({ content: "❌ Please provide a date (e.g., 0703).", ephemeral: true });
    return;
  }

  // Sprawdź czy istnieje aktywna sesja
  if (SessionManager.isSessionActive(interaction.guildId!)) {
    await interaction.reply({ content: "⚠️ QuickAdd session already active.", ephemeral: true });
    return;
  }

  // Tworzymy nową sesję
  const session = SessionManager.createSession({
    guildId: interaction.guildId!,
    moderatorId: interaction.user.id,
    eventType: "ReservoirRaid",
    date: args,
    parser: new ReservoirRaidParser()
  });

  // Otwórz tymczasowy kanał dla sesji
  await session.initChannel();

  await interaction.reply({ content: `🟢 QuickAdd session started for Reservoir Raid on ${args}`, ephemeral: true });
}