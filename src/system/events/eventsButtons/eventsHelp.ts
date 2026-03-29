// =====================================
// 📁 src/system/events/eventsButtons/eventsHelp.ts
// =====================================

import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { log } from "../../../core/logger/log";
import type { TraceContext } from "../../../core/trace/TraceContext";

export async function handleHelp(
  interaction: ButtonInteraction,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  if (!interaction.isButton()) return;

  const embed = new EmbedBuilder()
    .setTitle("Event Panel Guide")
    .setColor(0x1E90FF)
    .addFields(
      { 
        name: "👋 Welcome", 
        value: "Quick guide to our Event Panel – super easy once you get the hang of it!" 
      },
      { 
        name: "🎮 Main Buttons", 
        value: `
• **Create Event** – start a new event with a simple form  
• **Events List** – see events by category, check participants & absentees  
• **Cancel Event** – pause an event (doesn’t delete it)  
• **Manual Reminder** – send a reminder to participants anytime via select menu  
• **Show All** – view all events together (excludes birthdays), compare & download all lists  
• **Settings** – configure notifications & download channels  
• **Guide** – this guide 😎
        `
      },
      { 
        name: "⚡ Inside Event Buttons (Custom & Reservoir events only)", 
        value: `
• **Add Participant** – add participant(s)  
• **Remove Participant** – remove a single participant  
• **Mark Absent** – mark someone absent  
• **Show List** – see participants & absentees for this event  
• **Download** – get participant info for this event  
• **Compare** – compare this event with another one (Custom & Reservoir past events only)  
• **Clear Event Data** – wipes all data for this event ⚠️
        `
      },
      { 
        name: "📝 Event Creation Flow", 
        value: `
• **Birthday** – enter player name + date  
• **Custom** – enter event name, date, optional year  
• **Other Events** – pick a date; name is preset  
Auto reminders are set 1 hour before the event ⏰
        `
      },
      { 
        name: "💡 Tips", 
        value: `
• Only participants can be marked absent; to undo, re-add them to the participant list  
• When adding participants, multiple names can be added at once using commas  
• Dates must follow the formats shown above the panel
        `
      },
      { 
        name: "⚠️ Heads up", 
        value: `
Bot is still in beta! If something acts up, or you have ideas, just give me a shout – we’ll sort it out.  

- Arek 😌
        `
      }
    );

  try {
    await interaction.reply({ embeds: [embed], ephemeral: true });

    l.event("shown", {
      context: {
        guildId: interaction.guildId,
        userId: interaction.user.id,
      },
    });

  } catch (error) {
    l.error("show_failed", error);

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: "❌ Failed to show help.",
          components: []
        });
      } else {
        await interaction.reply({
          content: "❌ Failed to show help.",
          ephemeral: true
        });
      }
    } catch {
      // silent fail
    }
  }
}