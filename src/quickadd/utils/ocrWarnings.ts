// 🔥 UNIWERSALNY HELPER DO OCR (FIXED)

export type OCRAnalysis = {
  suspicious: boolean;
  confidence: number;
  warning?: string;
  suggestion?: string;
};

// =========================
// 🔍 MAIN FUNCTION
// =========================
export function analyzeEntry(
  nickname: string,
  value?: number
): OCRAnalysis {
  const problems: string[] = [];

  if (isSuspiciousNickname(nickname)) {
    problems.push("nickname");
  }

  if (value !== undefined && isSuspiciousValue(value)) {
    problems.push("value");
  }

  const suspicious = problems.length > 0;

  return {
    suspicious,
    confidence: suspicious ? 0.6 : 1, // 🔥 mniej agresywne
    warning: problems.join(", "),
    suggestion: suggestNickname(nickname),
  };
}

// =========================
// ⚠️ RULES (DOSTOSOWANE)
// =========================
function isSuspiciousNickname(name: string): boolean {
  return (
    name.length < 3 ||
    /^[0-9]+$/.test(name) ||
    /^[A-Za-z]\s[A-Za-z]$/.test(name)
  );
}

// 🔥 KLUCZOWY FIX
function isSuspiciousValue(value: number): boolean {
  return value < 1000; // 👈 zamiast 1_000_000
}

// =========================
// 💡 SUGGESTIONS
// =========================
function suggestNickname(name: string): string {
  return name
    .replace(/\s+/g, "")
    .replace(/[^\w\d_]/g, "")
    .trim();
}