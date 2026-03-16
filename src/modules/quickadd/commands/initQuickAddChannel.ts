import { ChatInputCommandInteraction, TextChannel, PermissionsBitField } from "discord.js";
import { client } from "../../botClient"; // import klienta Discord
import { QuickAddSessionManager } from "../session/SessionManager";

export const initQuickAddChannelCommand = {
    name: "initquickadd",
    description: "Tworzy kanał #quickadd do obsługi QuickAdd sesji",
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const guild = interaction.guild;
        const existingChannel = guild.channels.cache.find(
            (ch) => ch.type === 0 && ch.name === "quickadd"
        ) as TextChannel;

        if (existingChannel) {
            await interaction.reply({ content: "Kanał #quickadd już istnieje.", ephemeral: true });
            return;
        }

        try {
            const channel = await guild.channels.create({
                name: "quickadd",
                type: 0, // TextChannel
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.SendMessages],
                        allow: [PermissionsBitField.Flags.ViewChannel],
                    },
                ],
            });

            await interaction.reply({ content: "Kanał #quickadd został utworzony!", ephemeral: true });

            // Rejestracja kanału w menedżerze sesji
            QuickAddSessionManager.registerQuickAddChannel(channel.id);
        } catch (err) {
            console.error("Błąd tworzenia kanału QuickAdd:", err);
            await interaction.reply({ content: "Nie udało się utworzyć kanału.", ephemeral: true });
        }
    },
};