// src/quickadd/services/LlamaService.ts

const DEBUG_AI = true;

function log(...args: any[]) {
  if (DEBUG_AI) {
    console.log("[LLAMA]", ...args);
  }
}

export async function askLlama(prompt: string) {
  try {
    log("🤖 PROMPT START =====================");
    log(prompt);
    log("🤖 PROMPT END =======================");

    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3",
        prompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      log("❌ HTTP ERROR:", res.status);
      return null;
    }

    const data = await res.json();

    log("🤖 RAW RESPONSE START ===============");
    log(data);
    log("🤖 RAW RESPONSE END =================");

    const response = data?.response;

    if (!response || typeof response !== "string") {
      log("❌ INVALID RESPONSE FORMAT");
      return null;
    }

    return response.trim();
  } catch (err) {
    log("💥 LLAMA ERROR:", err);
    return null;
  }
}