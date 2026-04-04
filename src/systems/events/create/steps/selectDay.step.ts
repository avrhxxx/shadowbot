import { registerUIAction } from "@/ui/core/uiRouter";
import { formatButtonDate } from "@/shared/utils/timeUtils";

const DAYS_TO_SHOW = 8;

export function registerSelectDayStep() {
  registerUIAction("events.create.selectDay", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      const today = new Date();
      const buttons = [];

      for (let i = 0; i < DAYS_TO_SHOW; i++) {
        const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i));
        const label = formatButtonDate(date.getUTCDate(), date.getUTCMonth() + 1);
        const custom_id = `events.create.selectTime|day=${date.getUTCDate()}&month=${date.getUTCMonth() + 1}`;

        buttons.push({
          type: 2,
          label,
          style: 1,
          custom_id,
        });
      }

      const rows = [];
      for (let i = 0; i < buttons.length; i += 5) {
        rows.push({ type: 1, components: buttons.slice(i, i + 5) });
      }

      rows.push({
        type: 1,
        components: [
          { type: 2, label: "⬅ Back", style: 2, custom_id: "events.create.backToType" },
        ],
      });

      await interaction.update({
        content: "📅 **Select a day for your event:**",
        components: rows,
      });
    },
  });
}