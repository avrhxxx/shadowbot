import { 
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
  Guild
} from "discord.js";

import { createAbsence, getAbsences } from "../absenceService";
import { notifyAbsenceAdded } from "./absenceNotification";

function createTextInput(customId: string, label: string, placeholder: string) {
  return new TextInputBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(placeholder)
    .setRequired(true);
}

function createDateInput(customId: string, label: string) {
  return new TextInputBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Available formats are in the message above the panel")
    .setRequired(true);
}

export async function handleAddAbsence(interaction: ButtonInteraction) {

  const modal = new ModalBuilder()
    .setTitle("Add Absence")
    .setCustomId("absence_add_modal");

  const nickInput = createTextInput("player_nick","Player Nickname","Enter player nickname");
  const fromInput = createDateInput("absence_from","From Date");
  const toInput = createDateInput("absence_to","To Date");

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nickInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(fromInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(toInput)
  );

  await interaction.showModal(modal);
}

export async function handleAddAbsenceSubmit(interaction: ModalSubmitInteraction) {

  await interaction.deferReply({ ephemeral:true });

  const guildId = interaction.guildId!;
  const guild = interaction.guild as Guild;

  const nick = interaction.fields.getTextInputValue("player_nick").trim();
  const fromRaw = interaction.fields.getTextInputValue("absence_from").trim();
  const toRaw = interaction.fields.getTextInputValue("absence_to").trim();

  const absences = await getAbsences(guildId);

  if (absences.some(a => a.player.toLowerCase() === nick.toLowerCase())) {
    await interaction.followUp({ content:`❌ Player **${nick}** is already on the absence list.` });
    return;
  }

  const parseDate = (input:string)=>{
    const match = input.match(/^(\d{1,2})[./-]?(\d{1,2})$/);
    if(!match) return null;

    const day = parseInt(match[1]);
    const month = parseInt(match[2]);

    if(day<1 || day>31 || month<1 || month>12) return null;

    return {day,month};
  };

  const fromDate = parseDate(fromRaw);
  const toDate = parseDate(toRaw);

  if(!fromDate || !toDate){
    await interaction.followUp({content:"Invalid date format."});
    return;
  }

  const id = `${nick}-${fromDate.day}${fromDate.month}-${toDate.day}${toDate.month}`;

  try{

    await createAbsence({
      id,
      guildId,
      player:nick,
      startDate:`${fromDate.day}/${fromDate.month}`,
      endDate:`${toDate.day}/${toDate.month}`,
      createdAt:Date.now(),
      notified:false
    });

    await interaction.followUp({
      content:`✅ Absence for **${nick}** added.`
    });

    await notifyAbsenceAdded(
      guild,
      nick,
      `${fromDate.day}.${fromDate.month}`,
      `${toDate.day}.${toDate.month}`
    );

  }catch(err){
    console.error(err);
    await interaction.followUp({content:"❌ Failed to save absence."});
  }
}