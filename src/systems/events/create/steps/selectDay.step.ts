// =====================================
// 📁 src/systems/events/create/steps/selectDay.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import type { ButtonInteraction } from "discord.js";
import type { TraceContext } from "@/core/trace/TraceContext";
import { formatButtonDate } from "@/shared/utils/timeUtils";

// -------------------------------
// MAX dni do wyświetlenia
// -------------------------------
const DAYS_TO_SHOW = 8;

// ----------------------------
// REGISTER STEP: SELECT DAY
// Logika + UI w jednym pliku stepu
// ----------------------------
export function registerSelectDayStep() {
  registerUIAction("events.create.selectDay", {
    system: "events",
    handler: async (interaction: ButtonInteraction, ctx: TraceContext) => {
      if (!interaction.isButton()) return;

      // ----------------------------
      // Pobieramy dzisiejszą datę UTC i tworzymy przyciski
      // ----------------------------
      const today = new Date();
      const buttons = [];

      for (let i = 0; i < DAYS_TO_SHOW; i++) {
        const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i));
        const label = formatButtonDate(date.getUTCDate(), date.getUTCMonth() + 1); // np. "5th April"
        const custom_id = `events.create.selectTime|day=${date.getUTCDate()}&month=${date.getUTCMonth() + 1}`;

        buttons.push({
          type: 2,
          label,
          style: 1, // primary
          custom_id,
        });
      }

      // ----------------------------
      // Rozdzielamy przyciski na rzędy po max 5 w rzędzie
      // ----------------------------
      const rows = [];
      for (let i = 0; i < buttons.length; i += 5) {
        rows.push({ type: 1, components: buttons.slice(i, i + 5) });
      }

      // ----------------------------
      // Dodajemy przycisk back
      // ----------------------------
      rows.push({
        type: 1,
        components: [
          { type: 2, label: "⬅ Back", style: 2, custom_id: "events.create.backToType" },
        ],
      });

      // ----------------------------
      // Aktualizacja UI
      // ----------------------------
      await interaction.update({
        content: "📅 **Select a day for your event:**",
        components: rows,
      });
    },
  });
}