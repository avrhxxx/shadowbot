import { Interaction } from "discord.js";

export async function handleHelpButton(interaction: Interaction) {
    if (!interaction.isButton()) return;

    const helpMessage = `
📌 **Moderator Panel Help**

**Event Menu** → Opens the Event Panel, where you can:
• Create Event
• List Events
• Add Participant
• Remove Participant
• Mark Absent

**Points Menu** → Placeholder (points system, not implemented yet)

**Translator Menu** → Placeholder (translation management, not implemented yet)

**Help** → Shows this message
`;

    await interaction.reply({
        content: helpMessage,
        ephemeral: true
    });
}