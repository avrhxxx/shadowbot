// src/quickadd/core/QuickAddPipeline.ts

import { Message } from "discord.js";
import { debugTrace } from "../debug/DebugLogger";

const SCOPE = "PIPELINE";

export async function processImageInput(
  message: Message,
  session: any,
  imageUrl: string,
  traceId: string
) {
  debugTrace(SCOPE, "IMAGE_RECEIVED", traceId, {
    user: message.author.id,
    url: imageUrl,
  });

  // 🔥 NA RAZIE NIC NIE ROBIMY (TEST FLOW)
}