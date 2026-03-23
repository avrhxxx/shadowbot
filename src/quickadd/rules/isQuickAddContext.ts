// rules/isQuickAddContext.ts

export function isQuickAddContext(channel: any, session: SessionData): boolean {
  if (!channel) return false;

  return (
    channel.id === session.channelId ||
    channel.parentId === session.channelId
  );
}