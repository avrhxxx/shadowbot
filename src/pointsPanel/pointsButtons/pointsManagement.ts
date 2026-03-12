export function renderPointsManagementCategories(): MessageCreateOptions {
  const row = new ActionRowBuilder<ButtonBuilder>();
  POINT_CATEGORIES.forEach(cat => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`points_management_category_${cat.id}`)
        .setLabel(cat.label)
        .setStyle(ButtonStyle.Primary)
    );
  });

  return {
    content: "📌 **Points Management – Choose Category**",
    components: [row]
  };
}

export async function handlePointsManagement(interaction: ButtonInteraction<CacheType>) {
  if (interaction.customId.startsWith("points_management_category_")) {
    const categoryId = interaction.customId.replace("points_management_category_", "");
    if (categoryId === "donations") {
      await pointsDonations.handlePointsDonations(interaction);
    } else if (categoryId === "duel") {
      await pointsDuel.handlePointsDuel(interaction);
    }
  }
}