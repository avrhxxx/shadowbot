import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

export function registerCustomEventFormStep() {
  registerUIAction("events.create.customForm.submit", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isModalSubmit()) return;

      const day = Number(interaction.fields.getTextInputValue("day"));
      const month = Number(interaction.fields.getTextInputValue("month"));
      const hours = Number(interaction.fields.getTextInputValue("hours"));
      const minutes = Number(interaction.fields.getTextInputValue("minutes"));
      const title = interaction.fields.getTextInputValue("title");
      const description = interaction.fields.getTextInputValue("description");
      const notify = interaction.fields.getTextInputValue("notify") === "yes";

      const formatted = formatEventUTC(day, month, hours, minutes);

      await interaction.reply({
        content: `📝 Custom Event **${title}** scheduled for **${formatted}**${notify ? " (notification enabled)" : ""}\nDescription: ${description}`,
        ephemeral: true,
      });
    },
  });
}