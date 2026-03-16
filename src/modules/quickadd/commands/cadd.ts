import { Command } from "../types/Command";
import { QuickAddSessionManager } from "../session/SessionManager";

export const cadd: Command = {
    name: "cadd",
    description: "Start a Custom Event session (Add participants)",
    usage: "!cadd <DDMM>",
    execute: async (message, args) => {
        if (!args[0]) {
            message.reply("❌ Please provide the event date in DDMM format. Example: !cadd 0703");
            return;
        }

        const dateArg = args[0];

        const sessionManager = QuickAddSessionManager.getInstance();
        if (sessionManager.hasActiveSession()) {
            message.reply("⚠️ A QuickAdd session is already active. Please wait until it finishes.");
            return;
        }

        // TODO: Initialize Custom Event Add session
        // sessionManager.startSession("customEventAdd", dateArg, message.author.id);

        message.reply(`✅ Custom Event Add session started for date ${dateArg}. Please upload screenshots or manual list.`);
    }
};