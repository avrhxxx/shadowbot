export async function createEventInDB(data: any) {
  console.log("Event saved to DB:", data);
  return true;
}

export async function notifyEvent(data: any) {
  console.log("Notification sent for event:", data);
  return true;
}