import { ButtonInteraction, CacheType } from "discord.js";

export async function handleDonationsPanel(
  interaction: ButtonInteraction<CacheType>
) {
  await interaction.reply({
    content: "💰 Donations panel is not implemented yet.",
    ephemeral: true
  });
}