// =====================================
// 📁 src/systems/events/steps/create/events.create.steps.ts
// =====================================

import type { ButtonInteraction } from "discord.js";
import { getTempEvent, deleteTempEvent } from "../../store/create/events.create.store";
import { renderDayButtonsView, renderModalView, renderConfirmView } from "../../views/create/events.create.view";
import { sendNotification, saveEventToDB } from "../../core/event.service";

// 🔹 Lista typów eventów (przeniesiona ze starego silnika)
const EVENT_TYPES = [
  { label: "Arcadian Conquest", value: "arcadian_conquest", prefillName: "Arcadian Conquest" },
  { label: "City Contest", value: "city_contest", prefillName: "City Contest" },
  { label: "Reservoir Raid", value: "reservoir_raid", prefillName: "Reservoir Raid" },
  { label: "Ghoulion Pursuit", value: "ghoulion_pursuit", prefillName: "Ghoulion Pursuit" },
  { label: "KvK", value: "kvk", prefillName: "KvK" },
  { label: "Birthdays", value: "birthdays" },
  { label: "Custom", value: "custom" }
];

type Payload = {
  step?: string;
  tempId?: string;
  userId?: string;
  eventType?: string;
  notify?: "yes" | "no";
};

// wszystkie kroki flow
export const steps: Record<string, (interaction: ButtonInteraction, ctx: any, payload: Payload) => Promise<any>> = {
  start: handleStartStep,
  day: handleDayStep,
  modal: handleModalStep,
  confirm: handleConfirmStep,
  notify: handleNotifyStep,
};

export async function handleCreateFlow(interaction: ButtonInteraction, ctx: any, payload: Payload) {
  const step = payload?.step || "start";
  const handler = steps[step];
  if (!handler) throw new Error("unknown_step");
  return handler(interaction, ctx, payload);
}

// === START STEP ===
async function handleStartStep(interaction: ButtonInteraction, ctx: any, payload: Payload) {
  if (!interaction.isButton()) return;

  // renderowanie przycisków dla typów eventów w nowym systemie
  const components = EVENT_TYPES.map((type) => ({
    type: 2, // Button
    label: type.label,
    style: 1, // Primary
    custom_id: `events.main|action=create_step&eventType=${type.value}`
  }));

  // grupowanie przycisków w rzędy po 5
  const actionRows: any[] = [];
  for (let i = 0; i < components.length; i += 5) {
    actionRows.push({
      type: 1, // ActionRow
      components: components.slice(i, i + 5)
    });
  }

  await interaction.update({
    content: "📌 Select the type of event you want to create:",
    components: actionRows
  });
}

// === DAY STEP ===
async function handleDayStep(interaction: ButtonInteraction, ctx: any, payload: Payload) {
  return renderDayButtonsView(payload.userId!);
}

// === MODAL STEP ===
async function handleModalStep(interaction: ButtonInteraction, ctx: any, payload: Payload) {
  const { tempId, eventType } = payload;
  const standardTypes = ["arcadian_conquest","city_contest","reservoir_raid","ghoulion_pursuit","kvk"];

  // dla standardowych eventów → tylko Hour UTC + Minute UTC
  if (eventType && standardTypes.includes(eventType)) {
    return renderModalView(tempId!, { hourUTC: true, minuteUTC: true });
  }

  // dla birthdays → nickname + data
  if (eventType === "birthdays") {
    return renderModalView(tempId!, { nickname: true, fullDate: true });
  }

  // dla custom → nazwa + pełna data
  if (eventType === "custom") {
    return renderModalView(tempId!, { name: true, fullDate: true });
  }

  // fallback
  return renderModalView(tempId!);
}

// === CONFIRM STEP ===
async function handleConfirmStep(interaction: ButtonInteraction, ctx: any, payload: Payload) {
  const temp = getTempEvent(payload.tempId!, interaction.user.id);
  return renderConfirmView(temp);
}

// === NOTIFY STEP ===
async function handleNotifyStep(interaction: ButtonInteraction, ctx: any, payload: Payload) {
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