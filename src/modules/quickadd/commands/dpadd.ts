// src/modules/quickadd/commands/dpadd.ts

import { CommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { DuelPointsParser } from "../parsers/DuelPointsParser";

export async function dpAddCommand(interaction: CommandInteraction) {
  const args = interaction.options.getString("date");
  if (!args) {
    await interaction.reply({ content: "❌ Please provide a date (e.g., 0703).", ephemeral: true });
    return;
  }

  // Sprawdź, czy jest aktywna sesja
  if (SessionManager.isSessionActive(interaction.guildId!)) {
    await interaction.reply({ content: "⚠️ QuickAdd session already active.", ephemeral: true });
    return;
  }

  // Tworzymy nową sesję
  const session = SessionManager.createSession({
    guildId: interaction.guildId!,
    moderatorId: interaction.user.id,
    eventType: "DuelPoints",
    date: args,
    parser: new DuelPointsParser()
  });

  // Otwórz tymczasowy kanał dla sesji
  await session.initChannel();

  await interaction.reply({ content: `🟢 QuickAdd session started for Duel Points on ${args}`, ephemeral: true });
}