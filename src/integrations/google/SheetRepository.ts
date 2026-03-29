// =====================================
// 📁 src/integrations/google/SheetRepository.ts
// =====================================

import { readSheet, writeSheet } from "./googleSheetsStorage";

type Filter<T> = Partial<{ [K in keyof T]: T[K] }>;

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

    const headers: string[] = (rows[0] as string[]) || [];
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
  private ensureColumns(headers: string[], data: Partial<T>): void {
    for (const key of Object.keys(data)) {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    }
  }

  // =============================
  // 📤 SAVE ALL
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
    const { headers, dataRows } = await this.load();

    this.ensureColumns(headers, data);

    const row = this.mapObject(headers, data);

    await this.save(headers, [...dataRows, row]);

    return data;
  }

  // =============================
  // 🚀 CREATE MANY (BATCH INSERT)
  // =============================
  async createMany(dataArray: T[]): Promise<void> {
    if (!dataArray.length) return;

    const { headers, dataRows } = await this.load();

    dataArray.forEach((data) => this.ensureColumns(headers, data));

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

    const rowIndex = dataRows.findIndex((r) => r[idIndex] === id);
    if (rowIndex === -1) throw new Error("Row not found");

    this.ensureColumns(headers, partial);

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

    const filtered = dataRows.filter((r) => r[idIndex] !== id);

    await this.save(headers, filtered);
  }
}