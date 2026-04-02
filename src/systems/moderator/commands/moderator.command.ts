import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { renderModeratorHub } from "../views/moderator.view";

export async function handleModeratorCommand(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const view = await renderModeratorHub();

  await interaction.reply({
    content: view.content,
    components: view.components,
    ephemeral: true,
  });
}