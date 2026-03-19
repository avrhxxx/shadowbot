export type OCRAnalysis = {
  suspicious: boolean;
  confidence: number;
  warning?: string;
  suggestion?: string;
};

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
    confidence: suspicious ? 0.6 : 1,
    warning: problems.join(", "),
    suggestion: suggestNickname(nickname),
  };
}

function isSuspiciousNickname(name: string): boolean {
  return (
    name.length < 3 ||
    /^[0-9]+$/.test(name) ||
    /^[A-Za-z]\s[A-Za-z]$/.test(name)
  );
}

function isSuspiciousValue(value: number): boolean {
  return value < 1000;
}

function suggestNickname(name: string): string {
  return name
    .replace(/\s+/g, "")
    .replace(/[^\w\d_]/g, "")
    .trim();
}