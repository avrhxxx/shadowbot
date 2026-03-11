// src/pointsPanel/pointsHandler.ts
import { Interaction, ButtonInteraction, CacheType } from "discord.js";
import * as PB from "./pointsButtons";
import * as PS from "./pointsService";

export const IDS = {
  BUTTONS: {
    DONATIONS: "points_category_donations",
    DUEL: "points_category_duel",
    GUIDE: "points_guide",
    SETTINGS: "points_settings",
    // Dalej: przyciski w poszczególnych panelach
    ADD: "points_add",
    LIST: "points_list",
    COMPARE: "points_compare",
    BACK: "points_back"
  }
};

const BUTTON_HANDLERS: Record<string, (i: ButtonInteraction<CacheType>) => Promise<any>> = {
  [IDS.BUTTONS.DONATIONS]: async (i) => await PB.handleDonationsPanel(i),
  [IDS.BUTTON