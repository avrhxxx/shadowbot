
import {
  Client,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  Interaction,
  GuildMember
} from "discord.js";
import fs from "fs";
import path from "path";

interface EventParticipant { nick: string; present: boolean; }
interface EventData { id: string; name: string; timestamp: number; participants: EventParticipant[]; }

const DATA_PATH = path.join(__dirname, "../../data/events.json");

function loadEvents(): EventData[] {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")); } 
  catch { return []; }
}
function saveEvents(events: EventData[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2), "utf-8");
}

const pendingEvents = new Map<string, { name: string; day?: string; month?: string; time?: string }>();

export async function initEventModule(client: Client) {
  client.once("ready", async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return;
    let channel = guild.channels.cache.find(c => c.name === "moderation-panel" && c.isTextBased()) as TextChannel;
    if (!channel) channel = await guild.channels.create({ name: "moderation-panel", type: 0 }) as TextChannel;

    const messages = await channel.messages.fetch({ limit: 20 });
    if (messages.find(m => m.author.id === client.user?.id && m.content.includes("Event Management Panel"))) return;

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder().setCustomId("event_create").setLabel("Create Event").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("event_list").setLabel("List Events").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("event_help").setLabel("Help").setStyle(ButtonStyle.Success)
      );
    await channel.send({ content: "📌 Event Management Panel", components: [row] });
  });

  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.member) return;

    // Only moderators
    const member = interaction.member as GuildMember;
    if (!member.roles.cache.some(r => r.name === "Moderator")) {
      await interaction.reply({ content: "Only Moderators can use this panel.", ephemeral: true });
      return;
    }

    const events = loadEvents();

    // ===================== BUTTONS =====================
    if (interaction.isButton()) {
      // Create Event → modal for name
      if (interaction.customId === "event_create") {
        const modal = new ModalBuilder().setCustomId("modal_create_event_name").setTitle("Event Name");
        const nameInput = new TextInputBuilder().setCustomId("event_name").setLabel("Event Name").setStyle(TextInputStyle.Short).setRequired(true);
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput));
        await interaction.showModal(modal);
        return;
      }

      // List Events
      if (interaction.customId === "event_list") {
        if (events.length === 0) { await interaction.reply({ content: "No events yet.", ephemeral: true }); return; }
        const sorted = [...events].sort((a,b)=>a.timestamp-b.timestamp);
        const list = sorted.map(e=>`• **${e.name}** (${new Date(e.timestamp).toLocaleString()})`).join("\n");
        await interaction.reply({ content: `📅 Events:\n${list}`, ephemeral:true });
        return;
      }

      // Help
      if (interaction.customId === "event_help") {
        await interaction.reply({
          content: `**Event Panel Help**\n• Create Event → new event\n• List Events → show all events\n• Add/Remove → manage participants\n• Mark Absent → set absent\n• List → show participants`,
          ephemeral:true
        });
        return;
      }

      // Event action buttons (add, remove, absent, list)
      const parts = interaction.customId.split("_");
      if (parts.length === 2) {
        const [action, eventId] = parts;
        const event = events.find(e=>e.id===eventId);
        if (!event) { await interaction.reply({ content: "Event not found.", ephemeral:true }); return; }

        if (action === "list") {
          const present = event.participants.filter(p=>p.present).map(p=>p.nick);
          const absent = event.participants.filter(p=>!p.present).map(p=>p.nick);
          await interaction.reply({
            content: `**${event.name}**\n✅ Present: ${present.join(", ")||"none"}\n❌ Absent: ${absent.join(", ")||"none"}`,
            ephemeral:true
          });
          return;
        }

        if (["add","remove","absent"].includes(action)) {
          const modal = new ModalBuilder().setCustomId(`modal_${action}_${eventId}`).setTitle(`${action.toUpperCase()} Participant`);
          const nickInput = new TextInputBuilder().setCustomId("participant_nick").setLabel("Participant Nick").setStyle(TextInputStyle.Short).setRequired(true);
          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nickInput));
          await interaction.showModal(modal);
          return;
        }
      }

      // Confirm Event creation
      if (interaction.customId.startsWith("event_confirm_")) {
        const [, , userId, name] = interaction.customId.split("_");
        if (interaction.user.id !== userId) return;
        const data = pendingEvents.get(userId);
        if (!data?.day || !data?.month || !data?.time) {
          await interaction.reply({ content: "Select day, month and time first.", ephemeral:true }); return;
        }

        const [hour, minute] = data.time.split(":").map(Number);
        let year = new Date().getFullYear();
        let timestamp = new Date(year, Number(data.month)-1, Number(data.day), hour, minute).getTime();
        if (timestamp < Date.now()) { year+=1; timestamp = new Date(year, Number(data.month)-1, Number(data.day), hour, minute).getTime(); }

        const id = Date.now().toString();
        events.push({ id, name, timestamp, participants: [] });
        saveEvents(events);
        pendingEvents.delete(userId);

        // send event buttons
        const channel = interaction.channel as TextChannel;
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder().setCustomId(`add_${id}`).setLabel("Add").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`remove_${id}`).setLabel("Remove").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`absent_${id}`).setLabel("Mark Absent").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`list_${id}`).setLabel("List").setStyle(ButtonStyle.Success)
          );

        await interaction.update({ content: `📌 Event: **${name}**`, components:[row] });
        return;
      }
    }

    // ===================== MODALS =====================
    if (interaction.isModalSubmit()) {
      // Modal: Create Event Name
      if (interaction.customId === "modal_create_event_name") {
        const name = interaction.fields.getTextInputValue("event_name");
        pendingEvents.set(interaction.user.id, { name });

        // Select menus for day and month + text input for HH:MM
        const dayOptions = Array.from({ length: 31 }, (_, i) => ({ label:`${i+1}`, value:`${i+1}` }));
        const daySelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder().setCustomId(`event_day_${interaction.user.id}_${name}`).setPlaceholder("Select Day").addOptions(dayOptions)
        );

        const monthOptions = [
          { label:"January", value:"1"},{ label:"February", value:"2"},{ label:"March", value:"3"},
          { label:"April", value:"4"},{ label:"May", value:"5"},{ label:"June", value:"6"},
          { label:"July", value:"7"},{ label:"August", value:"8"},{ label:"September", value:"9"},
          { label:"October", value:"10"},{ label:"November", value:"11"},{ label:"December", value:"12"}
        ];
        const monthSelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder().setCustomId(`event_month_${interaction.user.id}_${name}`).setPlaceholder("Select Month").addOptions(monthOptions)
        );

        const timeInput = new TextInputBuilder().setCustomId("event_time").setLabel("Time (HH:MM)").setStyle(TextInputStyle.Short).setPlaceholder("20:00").setRequired(true);
        const timeRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput);

        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`event_confirm_${interaction.user.id}_${name}`).setLabel("Create Event").setStyle(ButtonStyle.Success)
        );

        await interaction.reply({ content:`Configuring event: **${name}**`, components:[daySelect, monthSelect, timeRow, confirmRow], ephemeral:true });
        return;
      }

      // Modal: Add / Remove / Absent participant
      const parts = interaction.customId.split("_");
      if (parts.length === 3) {
        const [, action, eventId] = parts;
        const event = events.find(e=>e.id===eventId);
        if (!event) { await interaction.reply({ content:"Event not found.", ephemeral:true }); return; }
        const nick = interaction.fields.getTextInputValue("participant_nick");

        if (action==="add" && !event.participants.some(p=>p.nick===nick)) event.participants.push({ nick, present:true });
        if (action==="remove") event.participants = event.participants.filter(p=>p.nick!==nick);
        if (action==="absent") { const p=event.participants.find(p=>p.nick===nick); if(p) p.present=false; }

        saveEvents(events);
        await interaction.reply({ content:`✅ Updated event **${event.name}**.`, ephemeral:true });
        return;
      }
    }

    // ===================== SELECT MENUS =====================
    if (interaction.isStringSelectMenu()) {
      const [type, , userId, name] = interaction.customId.split("_");
      if (interaction.user.id !== userId) return;

      if (!pendingEvents.has(userId)) pendingEvents.set(userId, { name });
      const data = pendingEvents.get(userId)!;

      if (type==="event") {
        const subType = interaction.customId.split("_")[1];
        if (subType==="day") data.day = interaction.values[0];
        if (subType==="month") data.month = interaction.values[0];
      }

      await interaction.deferUpdate();
    }
  });
}