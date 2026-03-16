import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSessionManager, QuickAddSession } from "../session/QuickAddSession";

export default {
  name: "cadd",
  description: "Start a Custom Event session (Add participants)",
  options: [
    {
      name: "date",
      description: "Event date in DDMM format (example: 0703)",
      type: 3, // STRING
      required: true,
    },
  ],

  async execute(interaction: ChatInputCommandInteraction) {
    const dateArg = interaction.options.getString("date", true);
    const manager = QuickAddSessionManager.getInstance();

    if (manager.hasActiveSession()) {
      await interaction.reply({
        content: "⚠️ A QuickAdd session is already active. Please wait until it finishes.",
        ephemeral: true,
      });
      return;
    }

    // Tworzymy nową sesję QuickAdd
    const session = new QuickAddSession(
      Date.now().toString(), // unikalny sessionId
      interaction.user.id,
      interaction.channelId
    );

    // Zarejestruj ją w menedżerze
    if (!manager.startSession(session)) {
      await interaction.reply({
        content: "❌ Nie udało się rozpocząć sesji w tym kanale.",
        ephemeral: true,
      });
      return;
    }

    // Możesz tu ustawić np. datę w sesji, jeśli dodasz właściwość w QuickAddSession
    session.addEntry({ type: "customEventDate", value: dateArg });

    await interaction.reply({
      content: `✅ Custom Event Add session started for date ${dateArg}. Please upload screenshots or manual list.`,
      ephemeral: true,
    });
  },
};