
// =====================================
// 📁 src/systems/events/views/events.view.ts
// =====================================

export function renderEventsView() {
  return {
    content: "📌 **Event Panel**",

    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Create Event",
            style: 1,
            custom_id: "events.action|type=create",
          },
          {
            type: 2,
            label: "Events List",
            style: 1,
            custom_id: "events.action|type=list",
          },
          {
            type: 2,
            label: "Manual Reminder",
            style: 1,
            custom_id: "events.action|type=reminder",
          },
          {
            type: 2,
            label: "Show All",
            style: 1,
            custom_id: "events.action|type=showAll",
          },
          {
            type: 2,
            label: "Cancel Event",
            style: 4,
            custom_id: "events.action|type=cancel",
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Guide",
            style: 3,
            custom_id: "events.action|type=help",
          },
          {
            type: 2,
            label: "Settings",
            style: 2,
            custom_id: "events.action|type=settings",
          },
        ],
      },
    ],
  };
}