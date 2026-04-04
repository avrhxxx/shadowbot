import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

export function registerSubmitEventStep() {
  registerUIAction("events.create.submit", {
    system: "events",
    handler: async (interaction: any) => {
      if (!interaction.isButton() && !interaction.isModalSubmit()) return;

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
      const notify = params.notify === "true";

      const formatted = formatEventUTC(day, month, hours, minutes);

      await interaction.reply({
        content: `✅ Event created for **${formatted}**${notify ? " (notification sent)" : ""}`,
        ephemeral: true,
      });
    },
  });
}