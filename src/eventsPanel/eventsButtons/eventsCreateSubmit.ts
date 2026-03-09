// -----------------------------------------------------------
// HANDLE CREATE SUBMIT
// -----------------------------------------------------------
export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
    const guildId = interaction.guildId!;
    let typeMatch = interaction.customId.match(/^event_create_modal_(.+)$/);
    let rawType = typeMatch ? typeMatch[1] : "custom";
    const eventType = rawType.startsWith("standard_") ? rawType.replace(/^standard_/, "") : rawType;

    let name = "";
    let datetimeRaw = "";
    let yearRaw: string | undefined;

    try { name = interaction.fields.getTextInputValue("event_name"); } catch {}
    try { datetimeRaw = interaction.fields.getTextInputValue("event_datetime"); } catch {}
    try { yearRaw = interaction.fields.getTextInputValue("event_year"); } catch {}

    const prefillMap: Record<string,string> = {
        arcadian_conquest: "Arcadian Conquest",
        city_contest: "City Contest",
        reservoir_raid: "Reservoir Raid",
        ghoulion_pursuit: "Ghoulion Pursuit"
    };
    if (prefillMap[eventType]) name = prefillMap[eventType];

    let day: number, month: number, hour = 0, minute = 0, year: number | undefined;

    if (eventType === "birthdays") {
        const dateMatch = datetimeRaw.trim().match(/^(\d{1,2})[./-]?(\d{1,2})$/);
        if (!dateMatch) {
            await safeReply(interaction, { content: "Invalid date format. Use DD/MM.", ephemeral: true });
            return;
        }
        day = parseInt(dateMatch[1], 10);
        month = parseInt(dateMatch[2], 10);
        hour = 0;
        minute = 0;
        year = new Date().getUTCFullYear();
    } else {
        const parsed = parseEventDateTime(datetimeRaw);
        if (!parsed && eventType !== "custom") {
            await safeReply(interaction, { content: "Invalid date/time format.", ephemeral: true });
            return;
        }
        day = parsed?.day ?? 1;
        month = parsed?.month ?? 1;
        hour = parsed?.hour ?? 0;
        minute = parsed?.minute ?? 0;
        const yearParsed = yearRaw ? parseInt(yearRaw, 10) : undefined;
        year = Number.isNaN(yearParsed) ? undefined : yearParsed;
    }

    const tempId = `E-${uuidv4()}`;
    const nowUTC = new Date();
    const eventDateUTC = year
        ? new Date(Date.UTC(year, month - 1, day, hour, minute))
        : getEventDateUTC(day, month, hour, minute);

    if ((eventType === "birthdays" || eventType === "custom") && !year && eventDateUTC.getTime() < nowUTC.getTime()) {
        tempEventStore.set(tempId, { id: tempId, name, day, month, hour, minute, guildId, eventType });
        await safeReply(interaction, {
            content: `The date ${formatEventUTC(day, month, hour, minute)} has passed. Schedule for next year?`,
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

    tempEventStore.set(tempId, {
        id: tempId,
        name,
        day,
        month,
        hour,
        minute,
        guildId,
        year: year ?? eventDateUTC.getUTCFullYear(),
        reminderBefore: eventType === "birthdays" ? 0 : 60,
        eventType
    });

    // Birthday -> finalizujemy od razu, reszta -> pokazuje przycisk
    if (eventType === "birthdays") {
        await finalizeEvent(interaction, tempId);
    } else {
        await showCreateNotificationConfirm(interaction, tempId);
    }
}