export function registerQuickAddListener(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guildId) return;

    const content = message.content.trim();
    const session = SessionManager.getSession(message.guildId);

    // =====================================================
    // 🔥 KOMENDY (NAJPIERW!)
    // =====================================================
    if (content.startsWith("!")) {
      const [rawCommand] = content.slice(1).trim().split(/\s+/);
      const command = rawCommand.toLowerCase();

      // ✅ START
      if (command === "start") {
        const { startQuickAddSession } = await import("./session/startQuickAddSession");
        await startQuickAddSession(message, "auto");
        return;
      }

      if (!session) {
        return message.reply("❌ No active session.");
      }

      if (message.channel.id !== session.channelId) {
        return message.reply("❌ Use session channel.");
      }

      if (session.moderatorId !== message.author.id) {
        return message.reply("❌ Not your session.");
      }

      if (command === "preview") return preview(message);
      if (command === "confirm") return confirm(message);
      if (command === "cancel") return cancel(message);
      if (command === "adjust") return adjust(message);
      if (command === "delete") return deleteEntry(message);
      if (command === "merge") return merge(message);
      if (command === "help") return help(message);

      return;
    }

    // =====================================================
    // ❌ BRAK SESJI (dopiero tutaj!)
    // =====================================================
    if (!session) return;
    if (message.channel.id !== session.channelId) return;
    if (session.moderatorId !== message.author.id) return;

    // =====================================================
    // 🖼️ OCR
    // =====================================================
    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();
      if (!attachment || !attachment.contentType?.startsWith("image/")) return;

      try {
        const { type, entries } = await processOCR(attachment.url);

        if (!session.parserType && type) {
          session.parserType = type;
          console.log(`🔒 Parser locked: ${type}`);
        }

        if (session.parserType && type && session.parserType !== type) {
          await message.reply(
            `❌ Wrong data type.\nExpected: ${session.parserType}, got: ${type}`
          );
          return;
        }

        if (!entries || entries.length === 0) {
          await message.reply("❌ Couldn't detect data.");
          return;
        }

        for (const entry of entries) {
          SessionData.addEntry(message.guildId!, mapEntry(entry));
        }

        await message.react("✅");
      } catch (err) {
        console.error("OCR error:", err);
        await message.react("❌");
      }

      return;
    }

    // =====================================================
    // 📝 MANUAL
    // =====================================================
    if (content.length > 0) {
      try {
        const lines = content
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        const { type, entries } = parseByImageType(lines);

        if (!session.parserType && type) {
          session.parserType = type;
          console.log(`🔒 Parser locked: ${type}`);
        }

        if (session.parserType && type && session.parserType !== type) {
          await message.reply(
            `❌ Wrong data type.\nExpected: ${session.parserType}, got: ${type}`
          );
          return;
        }

        if (!entries || entries.length === 0) {
          await message.reply("❌ Couldn't detect data type.");
          return;
        }

        for (const entry of entries) {
          SessionData.addEntry(message.guildId!, mapEntry(entry));
        }

        await message.react("✅");
      } catch (err) {
        console.error("Manual parse error:", err);
        await message.react("❌");
      }
    }
  });
}