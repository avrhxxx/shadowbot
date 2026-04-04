import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

export function registerSelectTimeStep() {
  registerUIAction("events.create.selectTime", {
    system: "events",
    handler: async (interaction: any) => {
      if (!interaction.isButton()) return;

      const paramsString = interaction.customId.split("|")[1];
      const [dayParam, monthParam] = paramsString.split("&");
      const day = Number(dayParam.split("=")[1]);
      const month = Number(monthParam.split("=")[1]);

      const modal = {
        title: `Set time for ${day}/${month} UTC`,
        custom_id: `events.create.selectTime.submit|day=${day}&month=${month}`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: "hours",
                label: "Hours (0-23, UTC)",
                style: 1,
                min_length: 1,
                max_length: 2,
                required: true,
              },
              {
                type: 4,
                custom_id: "minutes",
                label: "Minutes (0-59, UTC)",
                style: 1,
                min_length: 1,
                max_length: 2,
                required: true,
              },
            ],
          },
        ],
      };

      await interaction.showModal(modal);
    },
  });

  registerUIAction("events.create.selectTime.submit", {
    system: "events",
    handler: async (interaction: any) => {
      if (!interaction.isModalSubmit()) return;

      const paramsString = interaction.customId.split("|")[1];
      const [dayParam, monthParam] = paramsString.split("&");
      const day = Number(dayParam.split("=")[1]);
      const month = Number(monthParam.split("=")[1]);

      const hours = Number(interaction.fields.getTextInputValue("hours"));
      const minutes = Number(interaction.fields.getTextInputValue("minutes"));

      const formatted = formatEventUTC(day, month, hours, minutes);

      await interaction.reply({
        content: `⏰ Event time set for **${formatted}**`,
        ephemeral: true,
      });
    },
  });
}