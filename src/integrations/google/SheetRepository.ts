// =====================================
// 📁 src/integrations/google/SheetRepository.ts
// =====================================

import { readSheet, writeSheet } from "@/integrations/google/googleSheetsStorage";
import PQueue from "p-queue";

// =====================================
// 🔹 TYPES
// =====================================

type Filter<T> = Partial<{ [K in keyof T]: T[K] }>;

// =====================================
// 🔹 GLOBAL QUEUE (PER TAB)
// =====================================

const queueMap = new Map<string, PQueue>();

function getQueue(tab: string) {
  if (!queueMap.has(tab)) {
    queueMap.set(
      tab,
      new PQueue({ concurrency: 1 }) // 🔒 SERIALIZE OPERATIONS
    );
  }

  return queueMap.get(tab)!;
}

// =====================================
// 🧠 REPOSITORY
// =====================================

export class SheetRepository<T extends { id?: string }> {
  private tab: string;

  constructor(tab: string) {
    this.tab = tab;
  }

  // =============================
  // 📥 LOAD RAW
  // =============================
  private async load(): Promise<{
    headers: string[];
    dataRows: unknown[][];
  }> {
    const rows = await readSheet(this.tab);

    if (!rows || !rows.length) {
      return { headers: [], dataRows: [] };
    }

    const headers: string[] = [...((rows[0] as string[]) || [])];
    const dataRows = rows.slice(1) as unknown[][];

    return { headers, dataRows };
  }

  // =============================
  // 🔄 MAP ROW → OBJECT
  // =============================
  private mapRow(headers: string[], row: unknown[]): T {
    const obj: Record<string, unknown> = {};

    headers.forEach((h, i) => {
      let val = row[i];

      if (
        typeof val === "string" &&
        val.length > 1 &&
        (val.startsWith("[") || val.startsWith("{"))
      ) {
        try {
          val = JSON.parse(val);
        } catch {
          // ignore
        }
      }

      obj[h] = val ?? null;
    });

    return obj as T;
  }

  // =============================
  // 🔄 MAP OBJECT → ROW
  // =============================
  private mapObject(headers: string[], data: Partial<T>): unknown[] {
    return headers.map((h) => {
      const val = (data as Record<string, unknown>)[h];

      if (val === null || val === undefined) return "";

      if (Array.isArray(val) || typeof val === "object") {
        try {
          return JSON.stringify(val);
        } catch {
          return "";
        }
      }

      return val;
    });
  }

  // =============================
  // 🧠 ENSURE COLUMNS
  // =============================
  private ensureColumns(headers: string[], data: Partial<T>): string[] {
    const newHeaders = [...headers];

    for (const key of Object.keys(data)) {
      if (!newHeaders.includes(key)) {
        newHeaders.push(key);
      }
    }

    return newHeaders;
  }

  // =============================
  // 📤 SAVE
  // =============================
  private async save(headers: string[], rows: unknown[][]): Promise<void> {
    await writeSheet(this.tab, [headers, ...rows]);
  }

  // =============================
  // 🔍 FIND ALL
  // =============================
  async findAll(filter?: Filter<T>): Promise<T[]> {
    const { headers, dataRows } = await this.load();

    let data = dataRows.map((r) => this.mapRow(headers, r));

    if (filter) {
      data = data.filter((item) =>
        Object.entries(filter).every(([key, val]) =>
          (item as Record<string, unknown>)[key] === val
        )
      );
    }

    return data;
  }

  // =============================
  // 🔍 FIND BY ID
  // =============================
  async findById(id: string): Promise<T | null> {
    const items = await this.findAll();
    return items.find((i) => i.id === id) || null;
  }

  // =============================
  // ➕ CREATE
  // =============================
  async create(data: T): Promise<T> {
    return getQueue(this.tab).add(async () => {
      const { headers, dataRows } = await this.load();

      const newHeaders = this.ensureColumns(headers, data);
      const row = this.mapObject(newHeaders, data);

      await this.save(newHeaders, [...dataRows, row]);

      return data;
    });
  }

  // =============================
  // 🚀 CREATE MANY
  // =============================
  async createMany(dataArray: T[]): Promise<void> {
    if (!dataArray.length) return;

    return getQueue(this.tab).add(async () => {
      const { headers, dataRows } = await this.load();

      let newHeaders = [...headers];

      dataArray.forEach((data) => {
        newHeaders = this.ensureColumns(newHeaders, data);
      });

      const newRows = dataArray.map((data) =>
        this.mapObject(newHeaders, data)
      );

      await this.save(newHeaders, [...dataRows, ...newRows]);
    });
  }

  // =============================
  // ✏️ UPDATE
  // =============================
  async updateById(id: string, partial: Partial<T>): Promise<void> {
    return getQueue(this.tab).add(async () => {
      const { headers, dataRows } = await this.load();

      const idIndex = headers.indexOf("id");
      if (idIndex === -1) throw new Error("No 'id' column");

      const rowIndex = dataRows.findIndex((r) => r[idIndex] === id);
      if (rowIndex === -1) throw new Error("Row not found");

      const newHeaders = this.ensureColumns(headers, partial);

      const existing = this.mapRow(headers, dataRows[rowIndex]);
      const updated = { ...existing, ...partial };

      dataRows[rowIndex] = this.mapObject(newHeaders, updated);

      await this.save(newHeaders, dataRows);
    });
  }

  // =============================
  // ❌ DELETE
  // =============================
  async deleteById(id: string): Promise<void> {
    return getQueue(this.tab).add(async () => {
      const { headers, dataRows } = await this.load();

      const idIndex = headers.indexOf("id");
      if (idIndex === -1) throw new Error("No 'id' column");

      const filtered = dataRows.filter((r) => r[idIndex] !== id);

      await this.save(headers, filtered);
    });
  }
}