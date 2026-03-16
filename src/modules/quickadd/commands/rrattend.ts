import { Command } from "../types/Command";
import { QuickAddSessionManager } from "../session/SessionManager";

export const rrattend: Command = {
    name: "rrattend",
    description: "Start a Reservoir Raid session (Attend participants)",
    usage: "!rrattend <DDMM>",
    execute: async (message, args) => {
        if (!args[0]) {
            message.reply("❌ Please provide the event date in DDMM format. Example: !rrattend 0703");
            return;
        }

        const dateArg = args[0];

        const sessionManager = QuickAddSessionManager.getInstance();
        if (sessionManager.hasActiveSession()) {
            message.reply("⚠️ A QuickAdd session is already active. Please wait until it finishes.");
            return;
        }

        // TODO: Initialize Reservoir Raid Attend session
        // sessionManager.startSession("reservoirRaidAttend", dateArg, message.author.id);

        message.reply(`✅ Reservoir Raid Attend session started for date ${dateArg}. Please upload screenshots or manual list.`);
    }
};