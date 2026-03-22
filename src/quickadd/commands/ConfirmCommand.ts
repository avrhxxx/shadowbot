// src/quickadd/commands/ConfirmCommand.ts

import {
  Message,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

import { SessionStore } from "../session/sessionStore";

export async function confirm(message: Message) {
  const guildId = message.guildId!;
  const session = SessionStore.getSession(guildId);

  if (!session) {
    await message.reply("❌ Brak aktywnej sesji.");
    return;
  }

  const entries = SessionStore.getEntries(guildId);

  if (!entries || entries.length === 0) {
    await message.reply("❌ Brak danych do zapisania.");
    return;
  }

  // =====================================
  // 🔥 SELECT MENU (EVENT PICK)
  // =====================================

  const select = new StringSelectMenuBuilder()
    .setCustomId("quickadd_select_event")
    .setPlaceholder("Select event to assign data")
    .addOptions([
      {
        label: "Event 1",
        value: "event1",
      },
      {
        label: "Event 2",
        value: "event2",
      },
      {
        label: "Event 3",
        value: "event3",
      },
    ]);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    select
  );

  await message.reply({
    content: "📌 Select event to save data:",
    components: [row],
  });
}