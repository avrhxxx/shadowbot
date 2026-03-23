// =====================================
// 📁 src/quickadd/commands/commands/start/start.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("COMMAND");

export async function startCommand(
  interaction: ChatInputCommandInteraction
) {
  const guildId = interaction.guild!.id;

  log("start_attempt", {
    user: interaction.user.id,
    guildId,
  });

  const session = QuickAddSession.get(guildId);

  if (session) {
    log.warn("start_blocked_existing_session", {
      owner: session.ownerId,
    });

    return interaction.editReply({
      content: `❌ Session already active by <@${session.ownerId}>`,
    });
  }

  // =====================================
  // 🧵 CREATE THREAD (SESSION WORKSPACE)
  // =====================================
  const thread = await interaction.channel!.threads.create({
    name: `quickadd-${interaction.user.username}`,
    autoArchiveDuration: 60,
    reason: "QuickAdd session",
  });

  log("thread_created", {
    threadId: thread.id,
    name: thread.name,
  });

  // =====================================
  // 🧠 START SESSION (THREAD-BASED)
  // =====================================
  QuickAddSession.start(
    guildId,
    thread.id, // 🔥 session now bound to thread
    interaction.user.id
  );

  log("start_success", {
    user: interaction.user.id,
    threadId: thread.id,
  });

  // =====================================
  // 📩 MINIMAL REPLY (REDIRECT ONLY)
  // =====================================
  await interaction.editReply({
    content: 
`✅ Session started

🧵 Go to your thread:
→ <#${thread.id}>`,
  });

  // =====================================
  // 🧵 FULL ONBOARDING INSIDE THREAD
  // =====================================
  await thread.send({
    content:
`📸 **QuickAdd session started**

Send screenshots in this thread.

━━━━━━━━━━━━━━━━━━━

Status:
📥 received
⏳ processing
✅ done
❌ error

━━━━━━━━━━━━━━━━━━━

📊 Preview will appear automatically after each processed image.

✏️ Adjust entries using:
→ /qa adjust
→ /quickadd adjust`,
  });
}