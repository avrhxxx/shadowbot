import { QuickAddEntry } from "../types/QuickAddEntry";
import { PreviewBuffer } from "../preview/PreviewBuffer";
import { DuplicateDetector } from "../preview/DuplicateDetector";
import { ValidationService } from "./ValidationService";
import { ReservoirRaidParser } from "../parsers/ReservoirRaidParser";
import { DuelPointsParser } from "../parsers/DuelPointsParser";
import { DonationsParser, OCRSegment } from "../parsers/DonationsParser";

export type EventType = "RR" | "DP" | "DN";

export class QuickAddService {
  constructor(private previewBuffer: PreviewBuffer) {}

  // dla line-based RR / DP
  addLines(rawLines: string[], eventType: EventType) {
    const parser = eventType === "RR" ? ReservoirRaidParser : DuelPointsParser;
    const entries = rawLines.map(line => parser.parseLine(line));
    this.addEntries(entries);
  }

  // dla segment-based DN
  addSegments(segments: OCRSegment[]) {
    const entries = segments.map(seg => DonationsParser.parseSegment(seg));
    this.addEntries(entries);
  }

  private addEntries(entries: QuickAddEntry[]) {
    // dodanie do PreviewBuffer
    entries.forEach(entry => this.previewBuffer.addEntry(entry));

    // deduplikacja
    const allEntries = this.previewBuffer.getAllEntries();
    DuplicateDetector.markDuplicates(allEntries);

    // walidacja
    const validated = ValidationService.validateEntries(allEntries);

    // nadpisanie w PreviewBuffer
    this.previewBuffer.reset();
    validated.forEach(entry => this.previewBuffer.addEntry(entry));
  }

  confirm(): QuickAddEntry[] {
    const confirmed = this.previewBuffer.getAllEntries();
    // Tutaj można dodać integrację z pointsService / eventService
    this.previewBuffer.clear();
    return confirmed;
  }
}