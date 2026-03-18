import { EventType } from "../services/QuickAddService";
import { PreviewBuffer } from "../preview/PreviewBuffer";
import { QuickAddSessionState } from "../types/QuickAddSessionState";

export class QuickAddSession {
  guildId: string;
  moderatorId: string;
  eventType: EventType;
  eventDate: string;
  state: QuickAddSessionState;
  previewBuffer: PreviewBuffer;
  lastActivity: number;

  constructor(guildId: string, moderatorId: string, eventType: EventType, eventDate: string) {
    this.guildId = guildId;
    this.moderatorId = moderatorId;
    this.eventType = eventType;
    this.eventDate = eventDate;
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

  addActivity() {
    this.touch();
  }
}