// src/modules/quickadd/commands/index.ts
// Poprawiony indeks dla komend QuickAdd

// 🔹 Komendy typu Command (z export const)
import { AdjustCommand } from "./adjust";
import cadd from "./cadd";
import cattend from "./cattend";
import { PreviewCommand } from "./preview";
import { RepairCommand } from "./repair";
import rrattend from "./rrattend";

// 🔹 Komendy typu funkcja (z default export lub named export)
import dnAddCommand from "./dnadd";
import dpAddCommand from "./dpadd";
import rrAddCommand from "./rradd";
import confirmCommand from "./confirm";
import redoCommand from "./redo";
import QuickAddChannelInit from "./QuickAddChannelInit";
import QuickAddCommandRegistry from "./QuickAddCommandRegistry";

// Eksporty – w jednej paczce dla łatwego importu
export {
  AdjustCommand,
  cadd,
  cattend,
  PreviewCommand,
  RepairCommand,
  rrattend,
  dnAddCommand,
  dpAddCommand,
  rrAddCommand,
  confirmCommand,
  redoCommand,
  QuickAddChannelInit,
  QuickAddCommandRegistry,
};