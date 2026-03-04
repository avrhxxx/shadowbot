import { ButtonInteraction, EmbedBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";
import { EventObject } from "../eventService";

export async function handleCompare(interaction: ButtonInteraction, eventId: string) {
  const guildId = interaction.guildId!;
  const events: EventObject[] = await EventStorage.getEvents(guildId);

  const currentEvent = events.find(e => e.id === eventId);

  if (!currentEvent) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  if (currentEvent.status !== "PAST") {
    await interaction.reply({
      content: "You can only compare past events.",
      ephemeral: true
    });
    return;
  }

  // Znajdź wszystkie PAST i posortuj rosnąco po createdAt
  const pastEvents = events
    .filter(e => e.status === "PAST")
    .sort((a, b) => a.createdAt - b.createdAt);

  const currentIndex = pastEvents.findIndex(e => e.id === eventId);

  if (currentIndex <= 0) {
    await interaction.reply({
      content: "No previous past event to compare with.",
      ephemeral: true
    });
    return;
  }

  const previousEvent = pastEvents[currentIndex - 1];

  const participantsA = new Set(previousEvent.participants);
  const participantsB = new Set(currentEvent.participants);

  const absentA = new Set(previousEvent.absent || []);
  const absentB = new Set(currentEvent.absent || []);

  const reliable = [...participantsA].filter(id => participantsB.has(id));
  const missedOnce = [...participantsA].filter(id => absentB.has(id));
  const missedTwice = [...absentA].filter(id => absentB.has(id));

  const embed = new EmbedBuilder()
    .setTitle("📊 Attendance Comparison")
    .setDescription(
      `Comparing:\n` +
      `**${previousEvent.name}** → **${currentEvent.name}**\n\n` +

      `🟢 Reliable (${reliable.length})\n` +
      (reliable.length ? reliable.map(id => `<@${id}>`).join("\n") : "None") +

      `\n\n🟡 Missed Once (${missedOnce.length})\n` +
      (missedOnce.length ? missedOnce.map(id => `<@${id}>`).join("\n") : "None") +

      `\n\n🔴 Missed Twice (${missedTwice.length})\n` +
      (missedTwice.length ? missedTwice.map(id => `<@${id}>`).join("\n") : "None")
    )
    .setColor(0xff9900);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}