import { QuickAddEntry } from "../types/QuickAddEntry";
import { DuplicateDetector } from "../preview/DuplicateDetector";
import { ValidationService } from "./ValidationService";
import { ReservoirRaidParser } from "../parsers/ReservoirRaidParser";
import { DuelPointsParser } from "../parsers/DuelPointsParser";
import { DonationsParser, OCRSegment } from "../parsers/DonationsParser";
import { QuickAddSession } from "../session/QuickAddSession";
import { EventType } from "./QuickAddService"; // jeśli masz osobno, popraw import

// TODO: podmień na realne serwisy jak będą gotowe
type EventService = any;
type PointsService = any;

export class QuickAddService {
  constructor(
    private eventService: EventService,
    private pointsService: PointsService
  ) {}

  // -----------------------------
  // ADD LINES (RR / DP)
  // -----------------------------
  addLines(session: QuickAddSession, rawLines: string[]) {
    const eventType = session.context.eventType;

    const parser =
      eventType === "RR"
        ? ReservoirRaidParser
        : DuelPointsParser;

    const entries = rawLines.map(line => parser.parseLine(line));
    this.addEntries(session, entries);
  }

  // -----------------------------
  // ADD SEGMENTS (DN)
  // -----------------------------
  addSegments(session: QuickAddSession, segments: OCRSegment[]) {
    const entries = segments.map(seg => DonationsParser.parseSegment(seg));
    this.addEntries(session, entries);
  }

  // -----------------------------
  // CORE PROCESSING
  // -----------------------------
  private addEntries(session: QuickAddSession, entries: QuickAddEntry[]) {
    const buffer = session.previewBuffer;

    // dodanie
    entries.forEach(entry => buffer.addEntry(entry));

    // deduplikacja
    const allEntries = buffer.getAllEntries();
    DuplicateDetector.markDuplicates(allEntries);

    // walidacja
    const validated = ValidationService.validateEntries(allEntries);

    // reset + zapis
    buffer.reset();
    validated.forEach(entry => buffer.addEntry(entry));

    session.touch();
  }

  // -----------------------------
  // CONFIRM (FINAL COMMIT)
  // -----------------------------
  async confirm(session: QuickAddSession): Promise<void> {
    const entries = session.previewBuffer.getAllEntries();
    const context = session.context;

    if (!entries.length) {
      throw new Error("Brak wpisów do zatwierdzenia.");
    }

    switch (context.eventType) {
      case "RR":
        await this.eventService.addReservoirEntries(context, entries);
        break;

      case "DN":
        await this.pointsService.addDonationsEntries(context, entries);
        break;

      case "DP":
        await this.pointsService.addDuelEntries(context, entries);
        break;

      default:
        throw new Error(`Nieznany eventType: ${context.eventType}`);
    }

    // cleanup
    session.previewBuffer.clear();
    session.touch();
  }
}