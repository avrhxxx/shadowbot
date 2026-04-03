import { getTempEvent, createTempEvent, deleteTempEvent } from "../../../store/create/events.create.store";
import { renderDayButtonsView, renderModalView, renderConfirmView, renderNotifyView } from "../../../views/create/events.create.view";
import { getEventDateUTC } from "../../../shared/utils/timeUtils";
import { sendNotification, saveEventToDB } from "../../../core/event.service";

// wszystkie kroki flow
export const steps = {
  start: handleStartStep,
  day: handleDayStep,
  modal: handleModalStep,
  confirm: handleConfirmStep,
  notify: handleNotifyStep,
};

export async function handleCreateFlow(interaction, ctx, payload) {
  const step = payload?.step || "start";
  const handler = steps[step];
  if (!handler) throw new Error("unknown_step");
  return handler(interaction, ctx, payload);
}

// === START STEP ===
async function handleStartStep(interaction, ctx, payload) {
  // np. wybór eventu (standard/custom)
  // tutaj możemy od razu pokazać listę standardowych eventów do wyboru
  // zwracamy widok z przyciskami eventów
}

// === DAY STEP ===
async function handleDayStep(interaction, ctx, payload) {
  // wyświetlamy przyciski z dniami: today + next 7 days
  return renderDayButtonsView(payload.userId);
}

// === MODAL STEP ===
async function handleModalStep(interaction, ctx, payload) {
  // po kliknięciu dnia: pokaz modal na hour/minute UTC
  return renderModalView(payload.tempId);
}

// === CONFIRM STEP ===
async function handleConfirmStep(interaction, ctx, payload) {
  const temp = getTempEvent(payload.tempId, interaction.user.id);
  
  // wyświetlamy pełną datę + event name
  return renderConfirmView(temp);
}

// === NOTIFY STEP ===
async function handleNotifyStep(interaction, ctx, payload) {
  const { tempId, notify } = payload;
  const temp = getTempEvent(tempId, interaction.user.id);

  // zapis eventu do DB
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

  deleteTempEvent(tempId);
}