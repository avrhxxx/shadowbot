// src/modules/quickadd/session/QuickAddSession.ts

import { TextChannel, Client } from "discord.js";
import { TimeoutManager } from "./TimeoutManager";
import { QuickAddEntry } from "../types/QuickAddEntry";
import { QuickAddSessionState } from "../types/QuickAddSessionState";
import { SessionManager } from "./SessionManager";

export class QuickAddSession {
  private client: Client;
  private channel: TextChannel;
  private entries: QuickAddEntry[] = [];
  private state: QuickAddSessionState = "INIT";

  constructor(client: Client, channel: TextChannel) {
    this.client = client;
    this.channel = channel;

    // Zarejestruj kanał w SessionManager od razu przy tworzeniu sesji
    SessionManager.setChannel(channel);
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
    // Teraz jawnie podajemy kanał sesji
    TimeoutManager.start(this.channel);
  }

  public stopTimeoutMonitor() {
    TimeoutManager.clear();
  }

  private cleanup() {
    this.stopTimeoutMonitor();
    this.entries = [];
    SessionManager.clear();
    // Można tu dopisać dodatkowe logi lub powiadomienia
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