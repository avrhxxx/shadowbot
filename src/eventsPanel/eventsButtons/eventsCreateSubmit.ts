// -----------------------------------------------------------
// HANDLE CREATE SUBMIT (POPRAWIONY)
export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
    const guildId = interaction.guildId!;

    const typeMatch = interaction.customId.match(/^event_create_modal_(.+)$/);
    const eventType = typeMatch ? typeMatch[1] : "custom";

    let name = "";
    try { name = interaction.fields.getTextInputValue("event_name"); } catch {}
    let datetimeRaw = "";
    try { datetimeRaw = interaction.fields.getTextInputValue("event_datetime"); } catch {}
    let yearRaw: string | undefined;
    try { yearRaw = interaction.fields.getTextInputValue("event_year"); } catch {}

    const prefillMap: Record<string,string> = {
        arcadian_conquest: "Arcadian Conquest",
        city_contest: "City Contest",
        reservoir_raid: "Reservoir Raid",
        ghoulion_pursuit: "Ghoulion Pursuit"
    };
    if (prefillMap[eventType]) name = prefillMap[eventType];

    const parsed = parseEventDateTime(datetimeRaw);
    if (!parsed || (!name && ["birthdays","custom"].includes(eventType))) {
        if (canReply(interaction)) {
            await safeReply(interaction, { content: "Invalid date/time format or missing name.", ephemeral: true });
        }
        return;
    }

    const { day, month, hour, minute } = parsed;
    const yearParsed = yearRaw ? parseInt(yearRaw, 10) : undefined;
    const nowUTC = new Date();

    // jeśli użytkownik podał rok, używamy go dokładnie
    let eventDateUTC: Date;
    let yearFinal: number;
    if (yearParsed && !Number.isNaN(yearParsed)) {
        yearFinal = yearParsed;
        eventDateUTC = new Date(Date.UTC(yearFinal, month - 1, day, hour, minute));
    } else {
        // rok nie podany → bierzemy bieżący
        yearFinal = nowUTC.getUTCFullYear();
        eventDateUTC = new Date(Date.UTC(yearFinal, month - 1, day, hour, minute));

        // jeśli data w przeszłości i typ eventu wymaga korekty
        if ((eventType === "birthdays" || eventType === "custom") && eventDateUTC.getTime() < nowUTC.getTime()) {
            // przesuwamy tylko o +1 rok
            yearFinal += 1;
            eventDateUTC.setUTCFullYear(yearFinal);

            const tempId = `E-${uuidv4()}`;
            tempEventStore.set(tempId, { id: tempId, name, day, month, hour, minute, guildId, eventType, year: yearFinal });
            await safeReply(interaction, {
                content: `The date ${formatEventUTC(day, month, hour, minute)} has passed this year. Schedule for next year?`,
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setCustomId(`next_year_yes-${tempId}`).setLabel("Yes").setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId(`next_year_no-${tempId}`).setLabel("No").setStyle(ButtonStyle.Danger)
                    )
                ],
                ephemeral: true
            });
            return;
        }
    }

    const tempId = `E-${uuidv4()}`;
    tempEventStore.set(tempId, {
        id: tempId,
        name,
        day,
        month,
        hour,
        minute,
        guildId,
        year: yearFinal,
        reminderBefore: 60,
        eventType
    });

    await showCreateNotificationConfirm(interaction, tempId);
}