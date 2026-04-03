import { getTempEvent } from "../../store/create/events.create.store";
import { formatEventUTC } from "../../../shared/utils/timeUtils";

// === DAY BUTTONS ===
export function renderDayButtonsView(userId: string) {
  const buttons = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const label = date.toLocaleString("en-US", { day: "numeric", month: "long" }); // 1 April

    buttons.push({
      type: 2,
      label,
      style: 1,
      custom_id: `events.create|step=modal|day=${day}|month=${month}|userId=${userId}`,
    });
  }

  return {
    content: "Select a day for your event:",
    components: [{ type: 1, components: buttons }],
  };
}

// === MODAL VIEW ===
export function renderModalView(tempId: string) {
  return {
    type: 9, // modal
    title: "Set Event Time (UTC)",
    custom_id: `events.create|step=confirm|tempId=${tempId}`,
    components: [
      {
        type: 1,
        components: [
          { type: 4, custom_id: "hours", label: "Hours UTC", style: 1, min_length: 1, max_length: 2 },
          { type: 4, custom_id: "minutes", label: "Minutes UTC", style: 1, min_length: 1, max_length: 2 },
        ],
      },
    ],
  };
}

// === CONFIRM VIEW ===
export function renderConfirmView(temp) {
  return {
    content: `✅ Event **${temp.name}** scheduled on ${formatEventUTC(temp.day, temp.month, temp.hour, temp.minute)} UTC`,
    components: [
      {
        type: 1,
        components: [
          { type: 2, label: "Confirm", style: 3, custom_id: `events.create|step=notify|tempId=${temp.id}|notify=yes` },
          { type: 2, label: "Cancel", style: 2, custom_id: `events.create|step=notify|tempId=${temp.id}|notify=no` },
        ],
      },
    ],
  };
}