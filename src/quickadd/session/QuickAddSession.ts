import { PreviewBuffer } from "../preview/PreviewBuffer";

export type QuickAddSessionOptions = {
  eventType: "RR" | "DP" | "DN" | "RR_ATTEND";
  date?: string;
  week?: string;
};

export type QuickAddSessionState = "INIT" | "ACTIVE" | "CONFIRMED" | "CANCELLED";

export class QuickAddSession {
  guildId: string;
  moderatorId: string;
  channelId: string;

  eventType: QuickAddSessionOptions["eventType"];
  date?: string;
  week?: string;

  state: QuickAddSessionState;
  previewBuffer: PreviewBuffer;
  lastActivity: number;

  constructor(
    guildId: string,
    moderatorId: string,
    options: QuickAddSessionOptions,
    channelId: string
  ) {
    this.guildId = guildId;
    this.moderatorId = moderatorId;
    this.channelId = channelId;

    this.eventType = options.eventType;
    this.date = options.date;
    this.week = options.week;

    this.state = "INIT";
    this.previewBuffer = new PreviewBuffer();

    this.touch();
  }

  touch() {
    this.lastActivity = Date.now();
  }

  setState(state: QuickAddSessionState) {
    this.state = state;
    this.touch();
  }
}