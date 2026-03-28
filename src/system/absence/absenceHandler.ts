// =====================================
// 📁 src/system/absence/absenceInteraction.ts
// =====================================

import {
  Interaction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  CacheType,
} from "discord.js";

import * as AB from "./absenceButtons";

export const IDS = {
  BUTTONS: {
    ADD: "absence_add",
    REMOVE: "absence_remove",
    SHOW_LIST: "absence_list",
    SETTINGS: "absence_settings",
    HELP: "absence_help",
  },
  SELECTS: {
    SETTINGS_NOTIFICATION: "absence_settings_notification",
  },
  MODALS: {
    ADD: "absence_add_modal",
    REMOVE: "absence_remove_modal",
  },
};

// =============================
// 🧩 HANDLERS
// =============================

const BUTTON_HANDLERS: Record<
  string,
  (i: ButtonInteraction<CacheType>) => Promise<any>
> = {
  [IDS.BUTTONS.ADD]: async (i) => AB.handleAddAbsence(i),
  [IDS.BUTTONS.REMOVE]: async (i) => AB.handleRemoveAbsence(i),
  [IDS.BUTTONS.SHOW_LIST]: async (i) => AB.handleAbsenceList(i),
  [IDS.BUTTONS.SETTINGS]: async (i) => AB.handleSettings(i),
  [IDS.BUTTONS.HELP]: async (i) => AB.handleAbsenceHelp(i),
};

const SELECT_HANDLERS: Record<
  string,
  (i: StringSelectMenuInteraction<CacheType>) => Promise<any>
> = {
  [IDS.SELECTS.SETTINGS_NOTIFICATION]: async (i) =>
    AB.handleSettingsSelect(i),
};

// =============================
// 🔧 MODALS
// =============================

async function handleModal(
  interaction: ModalSubmitInteraction<CacheType>
): Promise<boolean> {
  const { customId } = interaction;

  if (customId === IDS.MODALS.ADD) {
    await AB.handleAddAbsenceSubmit(interaction);
    return true;
  }

  if (customId === IDS.MODALS.REMOVE) {
    await AB.handleRemoveAbsenceSubmit(interaction);
    return true;
  }

  return false;
}

// =============================
// 🚀 MAIN HANDLER (ROUTER READY)
// =============================

export async function handleAbsenceInteraction(
  interaction: Interaction<CacheType>
): Promise<boolean> {
  try {
    // =============================
    // 🔘 BUTTONS
    // =============================

    if (interaction.isButton()) {
      const handler = BUTTON_HANDLERS[interaction.customId];

      if (!handler) return false;

      await handler(interaction);
      return true;
    }

    // =============================
    // 📋 SELECTS
    // =============================

    if (interaction.isStringSelectMenu()) {
      const handler = SELECT_HANDLERS[interaction.customId];

      if (!handler) return false;

      await handler(interaction);
      return true;
    }

    // =============================
    // 🧾 MODALS
    // =============================

    if (interaction.isModalSubmit()) {
      return await handleModal(interaction);
    }

    return false;
  } catch (error) {
    console.error("Error handling absence interaction:", error);

    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content:
            "❌ An error occurred while processing this interaction.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            "❌ An error occurred while processing this interaction.",
          ephemeral: true,
        });
      }
    }

    return true; // 🔥 ważne: traktujemy jako "handled"
  }
}