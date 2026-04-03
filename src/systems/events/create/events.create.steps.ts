// =====================================
// 📁 src/systems/events/create/events.create.steps.ts
// =====================================

import type { TraceContext } from "@/core/trace/TraceContext";
import type { Interaction } from "discord.js";
import { renderStartView, renderTypeView, renderModalView, renderDayView, renderHourView, renderConfirmView } from "./events.create.view";
import { createTemp, getTemp } from "./events.create.store";

// --------------------------
// STEP HANDLERS
// --------------------------
export const steps: Record<string, Function> = {
  start: handleStart,
  type: handleType,
  modal: handleModal,
  day: handleDay,
  hour: handleHour,
  confirm: handleConfirm,
};

// --------------------------
// FLOW HANDLER
// --------------------------
export async function handleCreateFlow(interaction: Interaction, ctx: TraceContext, payload: any) {
  const step = payload?.step || "start";

  const stepHandler = steps[step];
  if (!stepHandler) throw new Error(`Unknown step: ${step}`);

  return stepHandler(interaction, ctx, payload);
}

// --------------------------
// STEP IMPLEMENTATIONS
// --------------------------
async function handleStart(interaction: Interaction, ctx: TraceContext, payload: any) {
  // Możesz prefillować standardowe nazwy eventów itp.
  return renderStartView();
}

async function handleType(interaction: Interaction, ctx: TraceContext, payload: any) {
  // Zapisujemy typ eventu w temp store
  const temp = createTemp({
    id: payload.tempId,
    userId: interaction.user.id,
    name: payload.name || "",
    type: payload.type || "",
    day: 0,
    month: 0,
    year: 0,
    hour: 0,
    minute: 0,
    createdAt: Date.now(),
  });

  return renderTypeView(temp);
}

async function handleModal(interaction: Interaction, ctx: TraceContext, payload: any) {
  const temp = getTemp(payload.tempId, interaction.user.id);
  // Aktualizacja danych z modalu
  temp.name = payload.name;
  temp.type = payload.type;
  return renderModalView(temp);
}

async function handleDay(interaction: Interaction, ctx: TraceContext, payload: any) {
  const temp = getTemp(payload.tempId, interaction.user.id);
  temp.day = payload.day;
  temp.month = payload.month;
  temp.year = payload.year;
  return renderDayView(temp);
}

async function handleHour(interaction: Interaction, ctx: TraceContext, payload: any) {
  const temp = getTemp(payload.tempId, interaction.user.id);
  temp.hour = payload.hour;
  temp.minute = payload.minute;
  return renderHourView(temp);
}

async function handleConfirm(interaction: Interaction, ctx: TraceContext, payload: any) {
  const temp = getTemp(payload.tempId, interaction.user.id);

  // Tutaj możesz wywołać service, np. zapis do DB lub powiadomienia
  // await createEvent(temp);
  return renderConfirmView(temp);
}