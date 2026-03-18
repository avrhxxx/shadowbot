interface Entry {
  nickname: string;
  value: number;
}

export class SessionData {
  private static data = new Map<string, Entry[]>();

  static addEntry(guildId: string, entry: Entry) {
    const current = this.data.get(guildId) || [];
    current.push(entry);
    this.data.set(guildId, current);
  }

  static getEntries(guildId: string): Entry[] {
    return this.data.get(guildId) || [];
  }

  static clear(guildId: string) {
    this.data.delete(guildId);
  }
}
