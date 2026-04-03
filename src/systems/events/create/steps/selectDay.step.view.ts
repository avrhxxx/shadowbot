// =====================================
// 📁 src/systems/events/create/steps/selectDay.step.view.ts
// =====================================

import type { View } from "@/shared/types";
import { formatButtonDate } from "@/shared/utils/timeUtils";

// -------------------------------
// MAX dni do wyświetlenia
// -------------------------------
const DAYS_TO_SHOW = 8;

export async function selectDayStepView(): Promise<View> {
  const today = new Date();
  const buttons = [];

  for (let i = 0; i < DAYS_TO_SHOW; i++) {
    const date = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + i
    ));

    const label = formatButtonDate(
      date.getUTCDate(),
      date.getUTCMonth() + 1
    );

    buttons.push({
      type: 2,
      label,
      style: 1,
      custom_id: `events.create.selectTime|day=${date.getUTCDate()}&month=${date.getUTCMonth() + 1}`,
    });
  }

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({
      type: 1,
      components: buttons.slice(i, i + 5),
    });
  }

  // Back
  rows.push({
    type: 1,
    components: [
      {
        type: 2,
        label: "⬅ Back",
        style: 2,
        custom_id: "events.create.backToType",
      },
    ],
  });

  return {
    content: "📅 **Select a day for your event:**",
    components: rows,
  };
}