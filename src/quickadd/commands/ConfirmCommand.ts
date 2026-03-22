// src/quickadd/commands/ConfirmCommand.ts

import {
  Message,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

import { SessionStore } from "../session/sessionStore";

import {
  getSelectableEvents,
  getSelectableWeeks,
} from "../services/QuickAddDataProvider";

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

  try {
    // =====================================
    // 🔥 POBIERZ DANE DO SELECTA
    // =====================================
    const eventOptions = await getSelectableEvents(guildId);
    const weekOptions = await getSelectableWeeks();

    const options = [...eventOptions, ...weekOptions];

    if (options.length === 0) {
      await message.reply("❌ Brak dostępnych eventów lub tygodni.");
      return;
    }

    // Discord limit = 25
    const finalOptions = options.slice(0, 25);

    // =====================================
    // 🔽 SELECT MENU
    // =====================================
    const select = new StringSelectMenuBuilder()
      .setCustomId("quickadd_select_event")
      .setPlaceholder("Wybierz gdzie zapisać dane...")
      .addOptions(finalOptions);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      select
    );

    await message.reply({
      content: `📌 Wybierz gdzie zapisać **${entries.length} wpisów**:`,
      components: [row],
    });

  } catch (err) {
    console.error("Confirm error:", err);
    await message.reply("❌ Błąd podczas przygotowania wyboru.");
  }
}