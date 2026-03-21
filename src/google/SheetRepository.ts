// src/google/SheetRepository.ts
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
  private async load() {
    const rows = await readSheet(this.tab);
    const headers: string[] = rows[0] || [];
    const dataRows = rows.slice(1);

    return { headers, dataRows };
  }

  // =============================
  // 🔄 MAP ROW → OBJECT
  // =============================
  private mapRow(headers: string[], row: any[]): T {
    const obj: any = {};

    headers.forEach((h, i) => {
      let val = row[i];

      // auto JSON parse
      if (typeof val === "string" && val.startsWith("[") || val?.startsWith("{")) {
        try { val = JSON.parse(val); } catch {}
      }

      obj[h] = val ?? null;
    });

    return obj;
  }

  // =============================
  // 🔄 MAP OBJECT → ROW
  // =============================
  private mapObject(headers: string[], data: Partial<T>): any[] {
    return headers.map((h) => {
      let val = (data as any)[h];

      if (Array.isArray(val) || typeof val === "object") {
        return JSON.stringify(val);
      }

      return val ?? "";
    });
  }

  // =============================
  // 🧠 ENSURE COLUMNS
  // =============================
  private ensureColumns(headers: string[], data: Partial<T>) {
    for (const key of Object.keys(data)) {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    }
  }

  // =============================
  // 📤 SAVE ALL
  // =============================
  private async save(headers: string[], rows: any[][]) {
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
          (item as any)[key] === val
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