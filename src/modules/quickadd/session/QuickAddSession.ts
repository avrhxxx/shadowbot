import { TextChannel, GuildMember } from "discord.js";
import { QuickAddEntry } from "../types/QuickAddEntry";
import { QuickAddSessionState } from "../types/QuickAddSessionState";

export class QuickAddSession {
    public channel: TextChannel;
    public entries: QuickAddEntry[] = [];
    public state: QuickAddSessionState = QuickAddSessionState.INIT;
    public moderator: GuildMember;

    constructor(channel: TextChannel, moderator: GuildMember) {
        this.channel = channel;
        this.moderator = moderator;
    }

    addEntry(entry: QuickAddEntry) {
        this.entries.push(entry);
    }

    setState(state: QuickAddSessionState) {
        this.state = state;
    }

    clearEntries() {
        this.entries = [];
    }
}