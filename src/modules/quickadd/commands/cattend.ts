import { Command } from "../types/Command";
import { QuickAddSessionManager } from "../session/SessionManager";

export const cattend: Command = {
    name: "cattend",
    description: "Start a Custom Event session (Mark attendance)",
    usage: "!cattend <DDMM>",
    execute: async (message, args) => {
        if (!args[0]) {
            message.reply("❌ Please provide the event date in DDMM format. Example: !cattend 0703");
            return;
        }

        const dateArg = args[0];

        const sessionManager = QuickAddSessionManager.getInstance();
        if (sessionManager.hasActiveSession()) {
            message.reply("⚠️ A QuickAdd session is already active. Please wait until it finishes.");
            return;
        }

        // TODO: Initialize Custom Event Attend session
        // sessionManager.startSession("customEventAttend", dateArg, message.author.id);

        message.reply(`✅ Custom Event Attend session started for date ${dateArg}. Please upload screenshots or manual list.`);
    }
};