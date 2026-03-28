// =====================================
// 📁 src/system/absence/absenceHandler.ts
// =====================================

import {
  Interaction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  CacheType,
} from "discord.js";

import { TraceContext } from "../../core/trace/TraceContext";

import {
  handleAddAbsence,
  handleRemoveAbsence,
  handleAbsenceList,
  handleSettings,
  handleAbsenceHelp,
  handleSettingsSelect,
  handleAddAbsenceSubmit,
  handleRemoveAbsenceSubmit,
} from "./absenceButtons";

// =====================================
// 🔹 IDS (WITH PREFIX)
// =====================================

const PREFIX = "absence";

export const IDS = {
  BUTTONS: {
    ADD: `${PREFIX}_add`,
    REMOVE: `${PREFIX}_remove`,
    SHOW_LIST: `${PREFIX}_list`,
    SETTINGS: `${PREFIX}_settings`,
    HELP: `${PREFIX}_help`,
  },
  SELECTS: {
    SETTINGS_NOTIFICATION: `${PREFIX}_settings_notification`,
  },
  MODALS: {
    ADD: `${PREFIX}_add_modal`,
    REMOVE: `${PREFIX}_remove_modal`,
  },
};

// =====================================
// 🧩 HANDLERS
// =====================================

const BUTTON_HANDLERS: Record<
  string,
  (i: ButtonInteraction<CacheType>) => Promise<any>
> = {
  [IDS.BUTTONS.ADD]: handleAddAbsence,
  [IDS.BUTTONS.REMOVE]: handleRemoveAbsence,
  [IDS.BUTTONS.SHOW_LIST]: handleAbsenceList,
  [IDS.BUTTONS.SETTINGS]: handleSettings,
  [IDS.BUTTONS.HELP]: handleAbsenceHelp,
};

const SELECT_HANDLERS: Record<
  string,
  (i: StringSelectMenuInteraction<CacheType>) => Promise<any>
> = {
  [IDS.SELECTS.SETTINGS_NOTIFICATION]: handleSettingsSelect,
};

// =====================================
// 🔧 MODALS
// =====================================

async function handleModal(
  interaction: ModalSubmitInteraction<CacheType>,
  ctx: TraceContext
): Promise<boolean> {
  const { customId } = interaction;

  if (customId === IDS.MODALS.ADD) {
    console.log(`[${ctx.traceId}] absence.modal.add`);
    await handleAddAbsenceSubmit(interaction);
    return true;
  }

  if (customId === IDS.MODALS.REMOVE) {
    console.log(`[${ctx.traceId}] absence.modal.remove`);
    await handleRemoveAbsenceSubmit(interaction);
    return true;
  }

  return false;
}

// =====================================
// 🚀 MAIN HANDLER (ROUTER READY)
// =====================================

export async function handleAbsenceInteraction(
  interaction: Interaction<CacheType>,
  ctx: TraceContext
): Promise<boolean> {
  try {
    // =============================
    // 🔘 BUTTONS
    // =============================

    if (interaction.isButton()) {
      const id = interaction.customId;
      const handler = BUTTON_HANDLERS[id];

      if (!handler) return false;

      console.log(`[${ctx.traceId}] absence.button`, { id });

      await handler(interaction);
      return true;
    }

    // =============================
    // 📋 SELECTS
    // =============================

    if (interaction.isStringSelectMenu()) {
      const id = interaction.customId;
      const handler = SELECT_HANDLERS[id];

      if (!handler) return false;

      console.log(`[${ctx.traceId}] absence.select`, { id });

      await handler(interaction);
      return true;
    }

    // =============================
    // 🧾 MODALS
    // =============================

    if (interaction.isModalSubmit()) {
      return await handleModal(interaction, ctx);
    }

    return false;
  } catch (error) {
    console.error(`[${ctx.traceId}] absence.error`, error);

    if (interaction.isRepliable()) {
      const payload = {
        content: "❌ An error occurred while processing this interaction.",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }

    return true; // traktujemy jako handled
  }
}