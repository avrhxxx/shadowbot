// =====================================
// 📁 src/systems/events/create/eventsCreate.view.ts
// =====================================

export function eventsCreateView() {
  const STANDARD_EVENT_TYPES = [
    { label: "Arcadian Conquest", value: "AC" },
    { label: "City Contest", value: "CC" },
    { label: "Reservoir Raid", value: "RR" },
    { label: "Ghoulion Pursuit", value: "GP" },
    { label: "KvK", value: "KVK" },
  ] as const;

  const OTHER_EVENT_TYPES = [
    { label: "Birthday", value: "BD" },
    { label: "Custom", value: "C" },
  ] as const;

  const mapToButton = (t: { label: string; value: string }) => ({
    type: 2,
    label: t.label,
    style: 1, // primary
    custom_id: `events.create.selectType|target=${t.value}`,
  });

  return {
    content: "📌 **Create Event**\n\nSelect an event type:",
    components: [
      { type: 1, components: STANDARD_EVENT_TYPES.map(mapToButton) },
      { type: 1, components: OTHER_EVENT_TYPES.map(mapToButton) },
    ],
  } as const;
}