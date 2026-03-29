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

import { log } from "../../core/logger/log";
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
// 🧩 HANDLERS (CTX VERSION)
// =====================================

const BUTTON_HANDLERS: Record<
  string,
  (i: ButtonInteraction<CacheType>, ctx: TraceContext) => Promise<any>
> = {
  [IDS.BUTTONS.ADD]: handleAddAbsence,
  [IDS.BUTTONS.REMOVE]: handleRemoveAbsence,
  [IDS.BUTTONS.SHOW_LIST]: handleAbsenceList,
  [IDS.BUTTONS.SETTINGS]: handleSettings,
  [IDS.BUTTONS.HELP]: handleAbsenceHelp,
};

const SELECT_HANDLERS: Record<
  string,
  (i: StringSelectMenuInteraction<CacheType>, ctx: TraceContext) => Promise<any>
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
  const l = log.ctx(ctx);

  l.event("modal_received", { customId });

  if (customId === IDS.MODALS.ADD) {
    await handleAddAbsenceSubmit(interaction, ctx);
    return true;
  }

  if (customId === IDS.MODALS.REMOVE) {
    await handleRemoveAbsenceSubmit(interaction, ctx);
    return true;
  }

  return false;
}

// =====================================
// 🚀 MAIN HANDLER (CTX READY)
// =====================================

export async function handleAbsenceInteraction(
  interaction: Interaction<CacheType>,
  traceId: string
): Promise<boolean> {
  const ctx: TraceContext = {
    traceId,
    source: "discord",
    system: "absence",
    userId: interaction.user?.id,
  };

  const l = log.ctx(ctx);

  try {
    // =============================
    // 🔘 BUTTONS
    // =============================

    if (interaction.isButton()) {
      const id = interaction.customId;
      const handler = BUTTON_HANDLERS[id];

      if (!handler) return false;

      l.event("button_click", { id });

      await handler(interaction, ctx);
      return true;
    }

    // =============================
    // 📋 SELECTS
    // =============================

    if (interaction.isStringSelectMenu()) {
      const id = interaction.customId;
      const handler = SELECT_HANDLERS[id];

      if (!handler) return false;

      l.event("select_change", { id });

      await handler(interaction, ctx);
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
    l.error("handler_error", error);

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

    return true;
  }
}