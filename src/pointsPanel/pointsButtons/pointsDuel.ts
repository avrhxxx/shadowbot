import { ButtonInteraction, CacheType } from "discord.js";

export async function handleDuelPanel(
  interaction: ButtonInteraction<CacheType>
) {
  await interaction.reply({
    content: "⚔️ Duel panel is not implemented yet.",
    ephemeral: true
  });
}