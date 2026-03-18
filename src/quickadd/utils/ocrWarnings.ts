// 🔥 UNIWERSALNY HELPER DO OCR

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

  if (hasOCRNoise(nickname)) {
    problems.push("ocr_noise");
  }

  const suspicious = problems.length > 0;

  return {
    suspicious,
    confidence: suspicious ? 0.5 : 1,
    warning: problems.join(", "),
    suggestion: suggestNickname(nickname),
  };
}

// =========================
// ⚠️ RULES
// =========================
function isSuspiciousNickname(name: string): boolean {
  return (
    name.length < 3 ||
    /^[0-9]+$/.test(name) ||
    /^[A-Za-z]\s[A-Za-z]$/.test(name) ||
    /\d{3,}/.test(name)
  );
}

function isSuspiciousValue(value: number): boolean {
  return value < 1_000_000;
}

function hasOCRNoise(name: string): boolean {
  return /[^\w\s_]/.test(name);
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