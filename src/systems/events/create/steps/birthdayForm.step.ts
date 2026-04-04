import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

export function registerBirthdayFormStep() {
  registerUIAction("events.create.birthdayForm.submit", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isModalSubmit()) return;

      const day = Number(interaction.fields.getTextInputValue("day"));
      const month = Number(interaction.fields.getTextInputValue("month"));
      const hours = Number(interaction.fields.getTextInputValue("hours"));
      const minutes = Number(interaction.fields.getTextInputValue("minutes"));
      const name = interaction.fields.getTextInputValue("name");
      const notify = interaction.fields.getTextInputValue("notify") === "yes";

      const formatted = formatEventUTC(day, month, hours, minutes);

      await interaction.reply({
        content: `🎉 Birthday Event for **${name}** set on **${formatted}**${notify ? " (notification enabled)" : ""}`,
        ephemeral: true,
      });
    },
  });
}