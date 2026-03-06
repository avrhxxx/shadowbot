// src/eventsPanel/eventsHelpers/heavyReportHelper.ts
import { EmbedBuilder, Guild, TextChannel, AttachmentBuilder } from "discord.js";
import { EventObject } from "../eventService";
import * as EventStorage from "../eventStorage";

// ==========================
// KONFIGURACJA LIMITÓW
// ==========================
const MAX_EMBED_CHARS = 6000; // max znaków w jednym embedzie Discord
const MAX_MESSAGE_CHARS = 2000; 
const MAX_FILE_CHARS = 1_000_000; 
const CHUNK_EVENTS = 5; 

// ==========================
// HEAVY LOAD CHECK
// ==========================
export function isHeavyLoad(events: EventObject[]): boolean {
  const totalParticipants = events.reduce((sum, e) => sum + e.participants.length, 0);
  return events.length > 10 || totalParticipants > 100;
}

// ==========================
// GENERACJA FRAGMENTÓW EMBED / PLIK
// ==========================
export function generateReportFragments(events: EventObject[]) {
  const embedFragments: EmbedBuilder[] = [];
  const fileFragments: { name: string; content: string }[] = [];

  let currentEmbedText = "";
  let currentFileText = "";
  let fileIndex = 1;

  for (const event of events) {
    const dateStr = `${event.day}/${event.month} ${event.hour}:${event.minute} UTC`;
    const status = event.status;
    const participants = event.participants.length ? event.participants.join("\n") : "None";
    const absent = event.absent?.length ? event.absent.join("\n") : "None";

    const block = `**${event.name}** — ${dateStr} (${status})\nParticipants:\n${participants}\nAbsent:\n${absent}\n\n====================\n\n`;

    // 🔹 Embedy
    if ((currentEmbedText + block).length > MAX_EMBED_CHARS) {
      embedFragments.push(new EmbedBuilder().setTitle("Event Report").setDescription(currentEmbedText).setColor(0x00ff00));
      currentEmbedText = block;
    } else {
      currentEmbedText += block;
    }

    // 🔹 Pliki
    if ((currentFileText + block).length > MAX_FILE_CHARS) {
      fileFragments.push({ name: `all_events_part${fileIndex}.txt`, content: currentFileText });
      currentFileText = block;
      fileIndex++;
    } else {
      currentFileText += block;
    }
  }

  if (currentEmbedText) embedFragments.push(new EmbedBuilder().setTitle("Event Report").setDescription(currentEmbedText).setColor(0x00ff00));
  if (currentFileText) fileFragments.push({ name: `all_events_part${fileIndex}.txt`, content: currentFileText });

  return { embedFragments, fileFragments };
}

// ==========================
// OBSŁUGA SEND DO CHANNEL
// ==========================
export async function sendHeavyReport(guild: Guild, events: EventObject[], downloadChannelId?: string) {
  if (!downloadChannelId) return;
  const channel = guild.channels.cache.get(downloadChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) return;

  const { embedFragments, fileFragments } = generateReportFragments(events);

  // 🔹 Wysyłka embedów
  for (const embed of embedFragments) {
    await channel.send({ embeds: [embed] });
  }

  // 🔹 Wysyłka plików
  for (const file of fileFragments) {
    const attachment = new AttachmentBuilder(Buffer.from(file.content, "utf-8"), { name: file.name });
    await channel.send({ files: [attachment] });
  }
}

// ==========================
// FUNKCJA POMOCNICZA — DZIELI PACZKI PO EVENTACH
// ==========================
export function chunkEvents(events: EventObject[], chunkSize: number = CHUNK_EVENTS): EventObject[][] {
  const chunks: EventObject[][] = [];
  for (let i = 0; i < events.length; i += chunkSize) {
    chunks.push(events.slice(i, i + chunkSize));
  }
  return chunks;
}