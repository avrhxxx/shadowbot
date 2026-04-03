// =====================================
// 📁 src/systems/events/main/events.main.view.ts
// =====================================

export type View = {
  content: string;
  components: any[];
};

// =====================================
// 🧠 MAIN VIEW
// =====================================

export async function eventsMainView(): Promise<View> {
  return {
    content: `📌 **Event Panel**\n\nSelect an option:`,

    components: [
      {
        type: 1, // row 1
        components: [
          {
            type: 2,
            label: "Create Event",
            style: 1,
            custom_id: "events.main.create",
          },
          {
            type: 2,
            label: "Events List",
            style: 1,
            custom_id: "events.main.list",
          },
          {
            type: 2,
            label: "Manual Reminder",
            style: 1,
            custom_id: "events.main.reminder",
          },
          {
            type: 2,
            label: "Show All",
            style: 1,
            custom_id: "events.main.show_all",
          },
          {
            type: 2,
            label: "Cancel Event",
            style: 4,
            custom_id: "events.main.cancel",
          },
        ],
      },
      {
        type: 1, // row 2
        components: [
          {
            type: 2,
            label: "Guide",
            style: 3,
            custom_id: "events.main.guide",
          },
          {
            type: 2,
            label: "Settings",
            style: 2,
            custom_id: "events.main.settings",
          },
        ],
      },
    ],
  };
}