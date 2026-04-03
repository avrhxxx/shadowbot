// =====================================
// 📁 src/systems/events/create/events.create.view.ts
// =====================================

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";
import type { TempEvent } from "./events.create.store";

// ==========================
// HELPERS
// ==========================
function createButton(label: string, customId: string, style: ButtonStyle = ButtonStyle.Primary, disabled = false) {
  return new ButtonBuilder()
    .setLabel(label)
    .setCustomId(customId)
    .setStyle(style)
    .setDisabled(disabled);
}

function createRow(...components: (ButtonBuilder | StringSelectMenuBuilder)[]) {
  return new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>().addComponents(...components);
}

// ==========================
// VIEWS
// ==========================

// 1️⃣ Start step
export function renderStartView(temp: TempEvent) {
  return {
    content: "🟢 Let's start creating your event! Choose an option below:",
    components: [
      createRow(
        createButton("Start", `events.create|step=type|id=${temp.id}`),
        createButton("Cancel", `events.create|step=cancel|id=${temp.id}`, ButtonStyle.Danger)
      )
    ]
  };
}

// 2️⃣ Type step
export function renderTypeView(temp: TempEvent) {
  const options = ["Custom", "Raid", "Birthday"].map(t => ({
    label: t,
    value: t.toLowerCase()
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`events.create|step=modal|id=${temp.id}`)
    .setPlaceholder("Select event type")
    .addOptions(options);

  return {
    content: "📌 Choose the event type:",
    components: [createRow(selectMenu)]
  };
}

// 3️⃣ Modal step (confirmation of type + name)
export function renderModalView(temp: TempEvent) {
  return {
    content: `✏️ Please confirm your event name: **${temp.name ?? "Not set"}**`,
    components: [
      createRow(
        createButton("Confirm", `events.create|step=day|id=${temp.id}`),
        createButton("Back", `events.create|step=type|id=${temp.id}`, ButtonStyle.Secondary)
      )
    ]
  };
}

// 4️⃣ Day & time selection step
export function renderDayTimeView(temp: TempEvent) {
  return {
    content: `🗓 Set the date & time for **${temp.name}**. Current: ${temp.day ?? "DD"}/${temp.month ?? "MM"} ${temp.hour ?? "HH"}:${temp.minute ?? "MM"} UTC`,
    components: [
      createRow(
        createButton("Set Day", `events.create|step=day_input|id=${temp.id}`),
        createButton("Set Hour", `events.create|step=hour_input|id=${temp.id}`, ButtonStyle.Secondary),
        createButton("Back", `events.create|step=modal|id=${temp.id}`, ButtonStyle.Secondary)
      )
    ]
  };
}

// 5️⃣ Confirm step
export function renderConfirmView(temp: TempEvent) {
  return {
    content: `✅ Event **${temp.name}** scheduled on ${temp.day}/${temp.month} ${temp.hour}:${temp.minute} UTC. Confirm?`,
    components: [
      createRow(
        createButton("Confirm", `events.create|step=confirm|id=${temp.id}`, ButtonStyle.Success),
        createButton("Cancel", `events.create|step=cancel|id=${temp.id}`, ButtonStyle.Danger)
      )
    ]
  };
}

// 6️⃣ Cancel / abort
export function renderCancelView(temp: TempEvent) {
  return {
    content: `❌ Event creation cancelled.`,
    components: []
  };
}