// =====================================
// 📁 src/integrations/google/googleRepository.ts
// =====================================

/**
 * 🧠 ROLE:
 * Generic data repository using Google as storage backend
 *
 * 📥 INPUT:
 * - SheetDefinition (structure)
 *
 * 📤 OUTPUT:
 * - typed CRUD operations
 *
 * ❗ NOTE:
 * - Currently uses Google Sheets
 * - Can be swapped in future without changing services
 *
 * ❗ RULES:
 * - NO direct Google API usage
 * - uses googleSheets core
 */

import { read, write } from "./googleSheets.js";
import { SheetDefinition } from "./googleSheetsSchema.js";

// =====================================
// 🔹 TYPES
// =====================================

type Filter<T> = Partial<{ [K in keyof T]: T[K] }>;

// =====================================
// 🧠 REPOSITORY
// =====================================

export class GoogleRepository<T extends { id?: string }> {
  constructor(private readonly sheet: SheetDefinition) {}

  // =============================
  // 📥 LOAD RAW
  // =============================

  private async load(): Promise<{
    headers: string[];
    dataRows: unknown[][];
  }> {
    const rows = await read(this.sheet.name);

    const headers = [...this.sheet.headers];

    const dataRows: unknown[][] =
      rows.length > 1
        ? rows.slice(1).map((r) => [...r])
        : [];

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
        } catch {}
      }

      obj[h] = val ?? null;
    });

    return obj as T;
  }

  // =============================
  // 🔄 MAP OBJECT → ROW
  // =============================

  private mapObject(
    headers: string[],
    data: Partial<T>
  ): unknown[] {
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

  private async save(rows: unknown[][]): Promise<void> {
    await write(this.sheet.name, [this.sheet.headers as string[], ...rows]);
  }

  // =============================
  // 🔍 FIND ALL
  // =============================

  async findAll(filter?: Filter<T>): Promise<T[]> {
    const { headers, dataRows } = await this.load();

    let data = dataRows.map((r) => this.mapRow(headers, r));

    if (filter) {
      data = data.filter((item) =>
        Object.entries(filter).every(([key, val]) => {
          const current = (item as Record<string, unknown>)[key];
          return current === val;
        })
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
    if (!data.id) {
      throw new Error("Cannot create entity without 'id'");
    }

    const { headers, dataRows } = await this.load();

    const row = this.mapObject(headers, data);

    await this.save([...dataRows, row]);

    return data;
  }

  // =============================
  // 🚀 CREATE MANY
  // =============================

  async createMany(dataArray: T[]): Promise<void> {
    if (!dataArray.length) return;

    dataArray.forEach((d) => {
      if (!d.id) {
        throw new Error("Cannot create entity without 'id'");
      }
    });

    const { headers, dataRows } = await this.load();

    const newRows = dataArray.map((data) =>
      this.mapObject(headers, data)
    );

    await this.save([...dataRows, ...newRows]);
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

    await this.save(dataRows);
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

    await this.save(filtered);
  }
}