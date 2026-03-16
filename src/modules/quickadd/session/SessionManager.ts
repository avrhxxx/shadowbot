import { TextChannel } from "discord.js";

export class SessionManager {
  private static activeChannel: TextChannel | null = null;

  public static setChannel(channel: TextChannel) {
    this.activeChannel = channel;
  }

  public static getChannel(): TextChannel | null {
    return this.activeChannel;
  }

  public static clear() {
    this.activeChannel = null;
  }
}