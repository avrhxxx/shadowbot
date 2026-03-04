import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { getEvents } from "../eventService";

export async function handleCompare(interaction: ButtonInteraction) {
  if (!interaction.isButton()) return;

  const guildId = interaction.guildId!;
  const events = await getEvents(guildId);

  const pastEvents = events
    .filter(e => e.status === "PAST")
    .sort((a, b) => b.createdAt - a.createdAt);

  if (pastEvents.length < 2) {
    return interaction.reply({
      content: "Not enough past events to compare.",
      ephemeral: true
    });
  }

  const eventA = pastEvents[1]; // starszy
  const eventB = pastEvents[0]; // nowszy

  const participantsA = new Set(eventA.participants);
  const participantsB = new Set(eventB.participants);

  const absentA = new Set(eventA.absent || []);
  const absentB = new Set(eventB.absent || []);

  const reliable = [...participantsA].filter(id =>
    participantsB.has(id)
  );

  const missedOnce = [...participantsA].filter(id =>
    absentB.has(id)
  );

  const missedTwice = [...absentA].filter(id =>
    absentB.has(id)
  );

  const embed = new EmbedBuilder()
    .setTitle("📊 Attendance Comparison")
    .setDescription(
      `Comparing:\n` +
      `Event: ${eventA.name} → ${eventB.name}\n\n` +

      `🟢 Reliable (${reliable.length})\n` +
      (reliable.map(id => `<@${id}>`).join("\n") || "None") +

      `\n\n🟡 Missed Once (${missedOnce.length})\n` +
      (missedOnce.map(id => `<@${id}>`).join("\n") || "None") +

      `\n\n🔴 Missed Twice (${missedTwice.length})\n` +
      (missedTwice.map(id => `<@${id}>`).join("\n") || "None")
    )
    .setColor(0xff9900);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}