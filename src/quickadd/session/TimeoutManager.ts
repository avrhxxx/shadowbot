type TimeoutData = {
  warningTimeout: NodeJS.Timeout;
  killTimeout: NodeJS.Timeout;
};

const timeouts = new Map<string, TimeoutData>();

const WARNING_TIME = 2 * 60 * 1000; // 2 min
const KILL_TIME = 3 * 60 * 1000; // 3 min

export function startTimeout(
  guildId: string,
  onWarning: () => void,
  onKill: () => void
) {
  clearTimeouts(guildId);

  const warningTimeout = setTimeout(() => {
    onWarning();
  }, WARNING_TIME);

  const killTimeout = setTimeout(() => {
    onKill();
    clearTimeouts(guildId);
  }, KILL_TIME);

  timeouts.set(guildId, { warningTimeout, killTimeout });
}

export function resetTimeout(
  guildId: string,
  onWarning: () => void,
  onKill: () => void
) {
  startTimeout(guildId, onWarning, onKill);
}

export function clearTimeouts(guildId: string) {
  const t = timeouts.get(guildId);
  if (!t) return;

  clearTimeout(t.warningTimeout);
  clearTimeout(t.killTimeout);

  timeouts.delete(guildId);
}