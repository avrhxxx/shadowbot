// =====================================
// 📁 src/integrations/google/googleRepository.ts
// =====================================

import { read, write } from "./googleSheets.js";
import type { SheetDefinition } from "./googleSchema.js";

// =====================================
// 🔹 TYPES
// =====================================

type Filter<T> = Partial<{ [K in keyof T]: T[K] }>;

// =====================================
// 🧠 REPOSITORY
// =====================================

export class GoogleRepository<T extends { id?: string }> {
  constructor(private readonly sheet: SheetDefinition) {}

  // =====================================
  // 📥 LOAD RAW
  // =====================================

  private async load(): Promise<{
    headers: readonly string[];
    dataRows: unknown[][];
  }> {
    const rows = await read(this.sheet.name);

    const headers = this.sheet.headers;

    const dataRows: unknown[][] =
      rows.length > 1 ? rows.slice(1).map((r) => [...r]) : [];

    return { headers, dataRows };
  }

  // =====================================
  // 🔄 ROW → OBJECT
  // =====================================

  private mapRow(
    headers: readonly string[],
    row: readonly unknown[]
  ): T {
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

  // =====================================
  // 🔄 OBJECT → ROW
  // =====================================

  private mapObject(
    headers: readonly string[],
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

  // =====================================
  // 📤 SAVE
  // =====================================

  private async save(rows: unknown[][]): Promise<void> {
    const data = [this.sheet.headers, ...rows].map((r) => [...r]);

    await write(this.sheet.name, data);
  }

  // =====================================
  // 🔍 FIND ALL
  // =====================================

  async findAll(filter?: Filter<T>): Promise<T[]> {
    const { headers, dataRows } = await this.load();

    let data = dataRows.map((r) => this.mapRow(headers, r));

    if (filter) {
      data = data.filter((item) =>
        Object.entries(filter).every(([key, val]) => {
          return (item as any)[key] === val;
        })
      );
    }

    return data;
  }

  // =====================================
  // 🔍 FIND BY ID
  // =====================================

  async findById(id: string): Promise<T | null> {
    const items = await this.findAll();
    return items.find((i) => i.id === id) ?? null;
  }

  // =====================================
  // ➕ CREATE
  // =====================================

  async create(data: T): Promise<T> {
    if (!data.id) {
      throw new Error("Missing 'id'");
    }

    const { headers, dataRows } = await this.load();

    const row = this.mapObject(headers, data);

    await this.save([...dataRows, row]);

    return data;
  }

  // =====================================
  // 🚀 CREATE MANY
  // =====================================

  async createMany(dataArray: T[]): Promise<void> {
    if (!dataArray.length) return;

    const { headers, dataRows } = await this.load();

    const newRows = dataArray.map((data) => {
      if (!data.id) throw new Error("Missing 'id'");
      return this.mapObject(headers, data);
    });

    await this.save([...dataRows, ...newRows]);
  }

  // =====================================
  // ✏️ UPDATE
  // =====================================

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

  // =====================================
  // ❌ DELETE
  // =====================================

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