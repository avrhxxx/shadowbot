// src/modules/quickadd/commands/QuickAddCommandRegistry.ts

import { Client } from "discord.js";

import adjust from "./adjust";
import cadd from "./cadd";
import cattend from "./cattend";
import confirm from "./confirm";
import dnadd from "./dnadd";
import dpadd from "./dpadd";
import preview from "./preview";
import redo from "./redo";
import repair from "./repair";
import rradd from "./rradd";
import rrattend from "./rrattend";

type QuickAddCommand = {
  name: string;
  description: string;
  options?: any[];
};

export const QuickAddCommands: QuickAddCommand[] = [
  adjust,
  cadd,
  cattend,
  confirm,
  dnadd,
  dpadd,
  preview,
  redo,
  repair,
  rradd,
  rrattend,
];

export function registerQuickAddCommands(client: Client) {
  client.once("ready", async () => {
    for (const guild of client.guilds.cache.values()) {
      for (const cmd of QuickAddCommands) {
        try {
          await guild.commands.create(cmd);
        } catch (err) {
          console.error(`❌ Błąd rejestracji komendy ${cmd.name}:`, err);
        }
      }
    }

    console.log("✅ Wszystkie komendy QuickAdd zarejestrowane.");
  });
}