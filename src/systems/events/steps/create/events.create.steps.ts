// =====================================
// 📁 src/systems/events/steps/create/events.create.steps.ts
// =====================================

import type { Interaction } from "discord.js";
import { getTempEvent, deleteTempEvent } from "../../../store/create/events.create.store"; // createTempEvent jest nieużywane
import { renderDayButtonsView, renderModalView, renderConfirmView /* , renderNotifyView */ } from "../../../views/create/events.create.view"; // renderNotifyView nieużywane
// getEventDateUTC nieużywane
import { sendNotification, saveEventToDB } from "../../../core/event.service";

type Payload = {
  step?: string;
  tempId?: string;
  userId?: string;
  notify?: "yes" | "no";
};

// wszystkie kroki flow
export const steps: Record<string, (interaction: Interaction, ctx: any, payload: Payload) => Promise<any>> = {
  start: handleStartStep,
  day: handleDayStep,
  modal: handleModalStep,
  confirm: handleConfirmStep,
  notify: handleNotifyStep,
};

export async function handleCreateFlow(interaction: Interaction, ctx: any, payload: Payload) {
  const step = payload?.step || "start";
  const handler = steps[step];
  if (!handler) throw new Error("unknown_step");
  return handler(interaction, ctx, payload);
}

// === START STEP ===
async function handleStartStep(interaction: Interaction, ctx: any, payload: Payload) {
  // np. wybór eventu (standard/custom)
  // tutaj możemy od razu pokazać listę standardowych eventów do wyboru
  // zwracamy widok z przyciskami eventów
  return; // placeholder
}

// === DAY STEP ===
async function handleDayStep(interaction: Interaction, ctx: any, payload: Payload) {
  return renderDayButtonsView(payload.userId!);
}

// === MODAL STEP ===
async function handleModalStep(interaction: Interaction, ctx: any, payload: Payload) {
  return renderModalView(payload.tempId!);
}

// === CONFIRM STEP ===
async function handleConfirmStep(interaction: Interaction, ctx: any, payload: Payload) {
  const temp = getTempEvent(payload.tempId!, interaction.user.id);
  return renderConfirmView(temp);
}

// === NOTIFY STEP ===
async function handleNotifyStep(interaction: Interaction, ctx: any, payload: Payload) {
  const { tempId, notify } = payload;
  const temp = getTempEvent(tempId!, interaction.user.id);

  await saveEventToDB(temp);

  if (notify === "yes") {
    await sendNotification(temp);
    await interaction.update({
      content: `✅ Event **${temp.name}** created and notification sent.`,
      components: [],
    });
  } else {
    await interaction.update({
      content: `✅ Event **${temp.name}** created. Notification skipped.`,
      components: [],
    });
  }

  deleteTempEvent(tempId!);
}