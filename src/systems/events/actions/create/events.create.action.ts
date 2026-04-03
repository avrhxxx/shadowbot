import { registerUIAction } from "@/ui/core/uiRouter";
import { handleCreateFlow } from "../../steps/create/events.create.steps";

registerUIAction("events.create", {
  system: "events",
  handler: async (interaction, ctx, payload) => {
    return handleCreateFlow(interaction, ctx, payload);
  },
});