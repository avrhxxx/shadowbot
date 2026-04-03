// =====================================
// 📁 src/systems/events/create/stepsViews/selectTime.view.ts
// =====================================

import type { Modal } from "discord.js";

/**
 * Funkcja zwracająca modal do ustawienia czasu eventu
 */
export function selectTimeView(day: number, month: number): Modal {
  return {
    title: `Set time for ${day}/${month} UTC`,
    custom_id: `events.create.selectTime.submit|day=${day}&month=${month}`,
    components: [
      {
        type: 1,
        components: [
          {
            type: 4, // TextInput
            custom_id: "hours",
            label: "Hours (0-23, UTC)",
            style: 1, // short
            min_length: 1,
            max_length: 2,
            required: true,
          },
          {
            type: 4,
            custom_id: "minutes",
            label: "Minutes (0-59, UTC)",
            style: 1, // short
            min_length: 1,
            max_length: 2,
            required: true,
          },
        ],
      },
    ],
  };
}