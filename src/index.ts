client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    if (reaction.emoji.name !== "🌍") return;
    if (!reaction.message.inGuild()) return;

    const message = reaction.message;

    // Embed z tytułem NA GÓRZE
    const embed = new EmbedBuilder()
        .setTitle("🌍 Translation Panel") // Tytuł nad autorem
        .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL()
        }) // Autor pod tytułem
        .setDescription(`"${message.content}"`) // Wiadomość pod autorem
        .setColor("Blue")
        .setFooter({
            text: "You have 60 seconds to choose a language."
        });

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];

    for (let i = 0; i < LANGUAGES.length; i += 5) {
        const row = new ActionRowBuilder<ButtonBuilder>();

        for (const lang of LANGUAGES.slice(i, i + 5)) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`translate_${message.id}_${lang.code}`)
                    .setLabel(lang.label)
                    .setEmoji(lang.emoji)
                    .setStyle(ButtonStyle.Primary)
            );
        }

        rows.push(row);
    }

    const panel = await message.channel.send({
        embeds: [embed],
        components: rows
    });

    // Collector pozostaje 60s, przyciski dalej działają
    const collector = panel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60_000
    });

    collector.on("collect", async interaction => {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const [, , langCode] = interaction.customId.split("_");

            const translated = await translateText(message.content, langCode);

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`🌍 Translation (${langCode.toUpperCase()})`)
                        .setDescription(`"${translated}"`)
                        .setColor("Green")
                ]
            });
        } catch (err) {
            console.error("Interaction error:", err);
        }
    });

    // Usunięcie panelu po 60 sekundach
    setTimeout(async () => {
        try {
            await panel.delete().catch(() => {}); // ignoruje błędy, np. jeśli już usunięty
        } catch {}
    }, 60_000);
});