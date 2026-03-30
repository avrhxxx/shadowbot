// =====================================
// 📁 src/integrations/google/googleSheetsRepository.ts
// =====================================

import { readSheet, writeSheet } from "@/integrations/google/googleSheetsStorage";
import { SheetDefinition } from "@/integrations/google/googleSheetsSchema";

// =====================================
// 🔹 TYPES
// =====================================

type Filter<T> = Partial<{ [K in keyof T]: T[K] }>;

// =====================================
// 🧠 REPOSITORY (FULL STRICT)
// =====================================

export class SheetRepository<T extends { id?: string }> {
  constructor(private readonly sheet: SheetDefinition) {}

  // =============================
  // 📥 LOAD RAW
  // =============================
  private async load(): Promise<{
    headers: readonly string[];
    dataRows: unknown[][];
  }> {
    const rows = await readSheet(this.sheet.name);

    // 🔥 STRICT: headers ALWAYS from schema
    const headers = this.sheet.headers;

    const dataRows = rows.length > 1 ? rows.slice(1) : [];

    return { headers, dataRows };
  }

  // =============================
  // 🔄 MAP ROW → OBJECT
  // =============================
  private mapRow(headers: readonly string[], row: unknown[]): T {
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
          // ignore invalid JSON
        }
      }

      obj[h] = val ?? null;
    });

    return obj as T;
  }

  // =============================
  // 🔄 MAP OBJECT → ROW
  // =============================
  private mapObject(headers: readonly string[], data: Partial<T>): unknown[] {
    return headers.map((h) => {
      const val = (data as Record<string, unknown>)[h];

      if (val === undefined || val === null) return "";

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
  // 📤 SAVE
  // =============================
  private async save(headers: readonly string[], rows: unknown[][]): Promise<void> {
    await writeSheet(this.sheet.name, [headers, ...rows]);
  }

  // =============================
  // 🔍 FIND ALL
  // =============================
  async findAll(filter?: Filter<T>): Promise<T[]> {
    const { headers, dataRows } = await this.load();

    let data = dataRows.map((r) => this.mapRow(headers, r));

    if (filter) {
      data = data.filter((item) =>
        Object.entries(filter).every(
          ([key, val]) =>
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
    return items.find((i) => i.id === id) ?? null;
  }

  // =============================
  // ➕ CREATE
  // =============================
  async create(data: T): Promise<T> {
    const { headers, dataRows } = await this.load();

    const row = this.mapObject(headers, data);

    await this.save(headers, [...dataRows, row]);

    return data;
  }

  // =============================
  // 🚀 CREATE MANY
  // =============================
  async createMany(dataArray: T[]): Promise<void> {
    if (!dataArray.length) return;

    const { headers, dataRows } = await this.load();

    const newRows = dataArray.map((data) =>
      this.mapObject(headers, data)
    );

    await this.save(headers, [...dataRows, ...newRows]);
  }

  // =============================
  // ✏️ UPDATE
  // =============================
  async updateById(id: string, partial: Partial<T>): Promise<void> {
    const { headers, dataRows } = await this.load();

    const idIndex = headers.indexOf("id");
    if (idIndex === -1) throw new Error("No 'id' column");

    const rowIndex = dataRows.findIndex(
      (r) => r[idIndex] === id
    );

    if (rowIndex === -1) {
      throw new Error("Row not found");
    }

    const existing = this.mapRow(headers, dataRows[rowIndex]);
    const updated = { ...existing, ...partial };

    dataRows[rowIndex] = this.mapObject(headers, updated);

    await this.save(headers, dataRows);
  }

  // =============================
  // ❌ DELETE
  // =============================
  async deleteById(id: string): Promise<void> {
    const { headers, dataRows } = await this.load();

    const idIndex = headers.indexOf("id");
    if (idIndex === -1) throw new Error("No 'id' column");

    const filtered = dataRows.filter(
      (r) => r[idIndex] !== id
    );

    await this.save(headers, filtered);
  }
}