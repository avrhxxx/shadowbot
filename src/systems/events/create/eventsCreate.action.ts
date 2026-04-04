// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import {
  eventsCreateView,
  birthdayFormModal,
  customEventFormView,
  selectDayView,
  selectTimeView,
  submitEventView,
  confirmEventView,
} from "./eventsCreate.view";
import { formatEventUTC } from "@/shared/utils/timeUtils";

// 🔹 Tworzymy wrapper, żeby dopasować UIContext do UIActionHandler
function withUIContext(handler: (ctx: UIContext, payload?: any) => Promise<void>) {
  return async (interaction: any, _unused?: any, payload?: any) => {
    const ctx: UIContext = {
      renderView: (view: any, p?: any) => interaction.renderView(view, p),
      showModal: (modal: any, p?: any) => interaction.showModal(modal, p),
      navigate: (dest: string, options?: Record<string, any>) => interaction.navigate(dest, options),
    };
    await handler(ctx, payload);
  };
}

interface UIContext {
  renderView: (view: any, payload?: any) => Promise<void>;
  showModal: (modal: any, payload?: any) => Promise<void>;
  navigate: (destination: string, options?: Record<string, any>) => Promise<void>;
}

// 🔹 Rejestracja wszystkich akcji flow Create Event
export function registerEventsCreateActions() {
  // START CREATE
  registerUIAction("events.create.start", {
    system: "events",
    handler: withUIContext(async (ctx) => {
      await ctx.renderView(eventsCreateView());
    }),
  });

  // SELECT TYPE
  registerUIAction("events.create.selectType", {
    system: "events",
    handler: withUIContext(async (ctx, payload) => {
      const target = payload?.target;
      if (target === "BD") await ctx.showModal(birthdayFormModal());
      else if (target === "C") await ctx.showModal(customEventFormView());
      else await ctx.renderView(selectDayView());
    }),
  });

  // BIRTHDAY FORM SUBMIT
  registerUIAction("events.create.birthdayForm.submit", {
    system: "events",
    handler: withUIContext(async (ctx, payload) => {
      const day = Number(payload?.day ?? 1);
      const month = Number(payload?.month ?? 1);
      const hours = Number(payload?.hours ?? 12);
      const minutes = Number(payload?.minutes ?? 0);
      const nickname = payload?.nickname ?? "User";
      const formatted = `${nickname} on ${formatEventUTC(day, month, hours, minutes)}`;

      await ctx.renderView({
        content: `🎉 Birthday Event for **${nickname}** set on **${formatted}**`,
        buttons: [{ label: "⬅ Back", action: "events.create.backToMain", style: "secondary" }],
      });
    }),
  });

  // CUSTOM EVENT FORM SUBMIT
  registerUIAction("events.create.customForm.submit", {
    system: "events",
    handler: withUIContext(async (ctx, payload) => {
      const name = payload?.name ?? "Unnamed Event";
      const day = Number(payload?.day ?? 1);
      const month = Number(payload?.month ?? 1);
      const hours = Number(payload?.hours ?? 12);
      const minutes = Number(payload?.minutes ?? 0);
      const formatted = `${formatEventUTC(day, month, hours, minutes)}`;

      await ctx.renderView({
        content: `📝 Event: **${name}**\n📅 Date: **${formatted}**`,
        buttons: [{ label: "⬅ Back", action: "events.create.backToMain", style: "secondary" }],
      });
    }),
  });

  // SELECT DAY
  registerUIAction("events.create.selectDay", {
    system: "events",
    handler: withUIContext(async (ctx) => {
      await ctx.renderView(selectDayView());
    }),
  });

  // SELECT TIME
  registerUIAction("events.create.selectTime", {
    system: "events",
    handler: withUIContext(async (ctx, payload) => {
      const day = Number(payload?.day);
      const month = Number(payload?.month);
      const eventName = payload?.eventName ?? "Event";
      await ctx.showModal(selectTimeView(day, month, eventName), payload);
    }),
  });

  // SELECT TIME SUBMIT
  registerUIAction("events.create.selectTime.submit", {
    system: "events",
    handler: withUIContext(async (ctx, payload) => {
      const day = Number(payload?.day);
      const month = Number(payload?.month);
      const eventName = payload?.eventName ?? "Event";
      const hours = Number(payload?.hours);
      const minutes = Number(payload?.minutes);

      await ctx.renderView({
        content: `⏰ **${eventName}** time set for **${formatEventUTC(day, month, hours, minutes)}**`,
        buttons: [
          { label: "⬅ Back", action: `events.create.selectDay`, style: "secondary" },
          { label: "🏠 Menu", action: "events.create.backToMain", style: "secondary" },
        ],
      });
    }),
  });

  // SUBMIT EVENT
  registerUIAction("events.create.submit", {
    system: "events",
    handler: withUIContext(async (ctx, payload) => {
      const day = Number(payload?.day);
      const month = Number(payload?.month);
      const hours = Number(payload?.hours);
      const minutes = Number(payload?.minutes);
      const eventName = payload?.eventName ?? "Event";

      await ctx.renderView(submitEventView(day, month, hours, minutes, eventName));
    }),
  });

  // CONFIRM EVENT
  registerUIAction("events.create.confirm", {
    system: "events",
    handler: withUIContext(async (ctx, payload) => {
      const day = Number(payload?.day);
      const month = Number(payload?.month);
      const hours = Number(payload?.hours);
      const minutes = Number(payload?.minutes);
      await ctx.renderView(confirmEventView(day, month, hours, minutes));
    }),
  });

  // BACK TO MAIN
  registerUIAction("events.create.backToMain", {
    system: "events",
    handler: withUIContext(async (ctx, payload) => {
      await ctx.navigate("events.main.create", {
        user: payload?.user,
        channel: payload?.channel,
        message: payload?.message,
      });
    }),
  });
}