// src/modules/quickadd/session/QuickAddSession.ts

import { TextChannel, Client } from "discord.js";
import { TimeoutManager } from "./TimeoutManager";
import { QuickAddEntry } from "../types/QuickAddEntry";
import { QuickAddSessionState } from "../types/QuickAddSessionState";

export class QuickAddSession {
  private client: Client;
  private channel: TextChannel;
  private entries: QuickAddEntry[] = [];
  private state: QuickAddSessionState = "INIT";

  constructor(client: Client, channel: TextChannel) {
    this.client = client;
    this.channel = channel;
  }

  public addEntry(entry: QuickAddEntry) {
    this.entries.push(entry);
  }

  public setState(newState: QuickAddSessionState) {
    this.state = newState;

    if (newState === "CANCELLED" || newState === "TIMEOUT") {
      this.cleanup();
    }
  }

  public startTimeoutMonitor() {
    TimeoutManager.start();
  }

  public stopTimeoutMonitor() {
    TimeoutManager.clear();
  }

  private cleanup() {
    this.stopTimeoutMonitor();
    this.entries = [];
    // Dodatkowe cleanup można tu dopisać, np. logi lub powiadomienia
  }

  public getEntries(): QuickAddEntry[] {
    return this.entries;
  }

  public getState(): QuickAddSessionState {
    return this.state;
  }

  public getChannel(): TextChannel {
    return this.channel;
  }
}