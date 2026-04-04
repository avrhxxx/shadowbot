import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

export function registerConfirmEventStep() {
  registerUIAction("events.create.confirm", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      const paramsString = interaction.customId.split("|")[1] || "";
      const params = paramsString.split("&").reduce((acc, cur) => {
        const [k, v] = cur.split("=");
        acc[k] = v;
        return acc;
      }, {} as Record<string, string>);

      const day = Number(params.day);
      const month = Number(params.month);
      const hours = Number(params.hours);
      const minutes = Number(params.minutes);

      const formatted = formatEventUTC(day, month, hours, minutes);

      await interaction.update({
        content: `✅ You are about to create the event for **${formatted}**.\nDo you want to notify the channel?`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: "Yes, create & notify",
                style: 3,
                custom_id: `events.create.submit|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=true`,
              },
              {
                type: 2,
                label: "Yes, create without notification",
                style: 1,
                custom_id: `events.create.submit|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=false`,
              },
              {
                type: 2,
                label: "⬅ Back",
                style: 2,
                custom_id: `events.create.backToTime|day=${day}&month=${month}`,
              },
            ],
          },
        ],
      });
    },
  });
}