import { Client } from "discord.js";
import { adjust } from "./adjust";
import { cadd } from "./cadd";
import { cattend } from "./cattend";
import { confirm } from "./confirm";
import { dnadd } from "./dnadd";
import { dpadd } from "./dpadd";
import { preview } from "./preview";
import { redo } from "./redo";
import { repair } from "./repair";
import { rradd } from "./rradd";
import { rrattend } from "./rrattend";

export const QuickAddCommands = [
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
    const guilds = client.guilds.cache.values();
    for (const guild of guilds) {
      for (const cmd of QuickAddCommands) {
        try {
          await guild.commands.create(cmd);
        } catch (err) {
          console.error(`Błąd rejestracji komendy ${cmd.name}:`, err);
        }
      }
    }
    console.log("✅ Wszystkie komendy QuickAdd zarejestrowane.");
  });
}