import { ReservoirRaidParser } from "./ReservoirRaidParser";
import { DuelPointsParser } from "./DuelPointsParser";
import { DonationsParser } from "./DonationsParser";

export function getParser(eventType: string) {
  switch (eventType) {
    case "RR":
    case "RR_ATTEND":
      return ReservoirRaidParser;

    case "DP":
      return DuelPointsParser;

    case "DN":
      return DonationsParser;

    default:
      throw new Error("Unknown event type");
  }
}