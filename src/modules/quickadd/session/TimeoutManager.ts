import { TextChannel } from "discord.js";

type TimeoutCallback = (channel: TextChannel) => void;

export class TimeoutManager {
  private static timeoutId: NodeJS.Timeout | null = null;
  private static timeoutDuration: number = 3 * 60 * 1000; // 3 minuty
  private static warningDuration: number = 2 * 60 * 1000; // 2 minuty
  private static warningTimeoutId: NodeJS.Timeout | null = null;

  public static start(channel: TextChannel, onTimeout: TimeoutCallback) {
    this.clear();

    // Ustaw warning przed timeoutem
    this.warningTimeoutId = setTimeout(() => {
      channel.send("⚠️ Sesja QuickAdd nieaktywna. Zamknięcie w 60 sekund.");
    }, this.warningDuration);

    // Ustaw właściwy timeout
    this.timeoutId = setTimeout(() => {
      onTimeout(channel);
      this.clear();
    }, this.timeoutDuration);
  }

  public static reset(channel: TextChannel, onTimeout: TimeoutCallback) {
    this.start(channel, onTimeout);
  }

  public static clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
  }
}