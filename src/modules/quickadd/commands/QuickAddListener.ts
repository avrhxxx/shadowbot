import { Client, Message, TextChannel } from "discord.js";
import { QuickAddSession } from "../session/QuickAddSession";

// Mapowanie prefiksów i pełnych nazw komend na typ sesji
const COMMAND_MAP: Record<string, string> = {
  rradd: "ReservoirRaid",
  reservoiradd: "ReservoirRaid",
  dpadd: "DuelPoints",
  duelpointsadd: "DuelPoints",
  dnadd: "Donations",
  donationsadd: "Donations",
};

export function registerQuickAddListener(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    // Ignorujemy wiadomości od botów
    if (message.author.bot) return;

    // Sprawdź prefiks !
    if (!message.content.startsWith("!")) return;

    const args = message.content.slice(1).trim().split(/\s+/);
    const command = args.shift()?.toLowerCase();

    if (!command || !COMMAND_MAP[command]) return;

    // Wybrany typ sesji
    const eventType = COMMAND_MAP[command];

    // Sprawdź, czy kanał jest TextChannel
    if (!(message.channel instanceof TextChannel)) {
      message.reply("QuickAdd może działać tylko w kanałach tekstowych Discord.");
      return;
    }

    // Utwórz sesję QuickAdd
    const session = new QuickAddSession(client, message.channel);

    // Na razie logujemy start sesji
    await message.channel.send(
      `🟢 QuickAdd sesja uruchomiona dla: ${eventType}. Moderator: ${message.author.username}`
    );

    // Start timeout monitoringu
    session.startTimeoutMonitor();

    // Możemy tu dopisać dalsze logiki np. dodawanie wpisów, preview itp.
  });
}