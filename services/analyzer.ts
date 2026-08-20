export type ScanType = "text" | "url" | "email";
export type Severity = "low" | "medium" | "high" | "critical";

export type Indicator = {
  label: string;
  detail: string;
  severity: Severity;
};

const rules: Array<{ label: string; detail: string; pattern: RegExp; points: number; severity: Severity }> = [
  { label: "Credential request", detail: "The content asks for a password, login, verification code, or account details.", pattern: /\b(password|passcode|one[- ]time code|otp|credentials?|sign in|verify your account|login)\b/i, points: 24, severity: "high" },
  { label: "Urgency language", detail: "Pressure to act immediately is a common social-engineering tactic.", pattern: /\b(urgent|immediately|within \d+ hours?|act now|final warning|expires today|suspended)\b/i, points: 18, severity: "high" },
  { label: "Financial request", detail: "The content asks for money, payment, gift cards, or banking information.", pattern: /\b(wire|gift cards?|bank transfer|payment|invoice|refund|crypto|bitcoin|banking)\b/i, points: 20, severity: "high" },
  { label: "Threatening language", detail: "Threats or consequences are used to influence the recipient.", pattern: /\b(arrest|legal action|penalty|prosecution|lose access|account will be closed)\b/i, points: 14, severity: "medium" },
  { label: "Suspicious URL", detail: "The link uses a high-risk pattern often associated with phishing.", pattern: /(https?:\/\/)?(\d{1,3}\.){3}\d{1,3}|bit\.ly|tinyurl|t\.co\/|login[-.]|verify[-.]/i, points: 28, severity: "critical" },
  { label: "Impersonation cue", detail: "The message references trusted brands or authority in a way that can be used to impersonate them.", pattern: /\b(paypal|microsoft|google|apple|amazon|irs|bank|support team|security team)\b/i, points: 10, severity: "medium" },
];

function severityFor(score: number): Severity {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export function analyzeContent(content: string, type: ScanType) {
  const indicators = rules.filter((rule) => rule.pattern.test(content)).map(({ label, detail, severity }) => ({ label, detail, severity }));
  let score = indicators.reduce((sum, indicator) => sum + (rules.find((r) => r.label === indicator.label)?.points ?? 0), 0);
  if (type === "url" && !/^https?:\/\/[^/\s]+\.[^/\s]+/i.test(content.trim())) score += 16;
  score = Math.min(100, score);
  const severity = severityFor(score);
  const classification = score >= 50 ? "phishing" : score >= 25 ? "suspicious" : "likely_safe";
  const explanation = indicators.length
    ? `ShieldAI detected ${indicators.length} signal${indicators.length === 1 ? "" : "s"} commonly associated with social engineering and malicious content.`
    : "No strong phishing or malicious-content signals were detected in this submission.";
  const recommendations = score >= 50
    ? ["Do not click links or open attachments", "Never provide credentials or payment details", "Verify the sender through a trusted channel", "Report the content to your security team"]
    : score >= 25
      ? ["Treat the content cautiously", "Verify the sender and destination independently", "Avoid sharing sensitive information"]
      : ["No immediate action is required", "Continue using normal security hygiene", "Contact the sender through a trusted channel if unsure"];
  return { score, severity, classification, indicators, explanation, recommendations };
}