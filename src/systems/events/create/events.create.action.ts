// =====================================
// 📁 src/systems/events/create/events.create.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import type { TraceContext } from "@/core/trace/TraceContext";
import { handleCreateFlow } from "./events.create.steps";

registerUIAction("events.create", {
  system: "events",

  handler: async (interaction, ctx: TraceContext, payload) => {
    // Wszystko idzie do flow handlera
    try {
      return await handleCreateFlow(interaction, ctx, payload);
    } catch (err) {
      console.error("events.create failed", err);
      await interaction.reply({
        content: "❌ Something went wrong while handling event creation.",
        ephemeral: true,
      }).catch(() => null);
    }
  },
});