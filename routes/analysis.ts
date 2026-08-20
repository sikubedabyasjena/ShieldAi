import { Router, type IRouter } from "express";
import { AnalyzeThreatBody } from "@workspace/api-zod";
import { analyzeContent, type ScanType } from "../services/analyzer";

type HistoryItem = {
  id: string;
  type: ScanType;
  preview: string;
  riskScore: number;
  severity: string;
  classification: string;
  createdAt: string;
};

const history: HistoryItem[] = [
  { id: "seed-1", type: "email", preview: "Your account will be suspended unless you verify...", riskScore: 82, severity: "critical", classification: "phishing", createdAt: new Date(Date.now() - 1000 * 60 * 34).toISOString() },
  { id: "seed-2", type: "url", preview: "https://docs.example.com/security-guide", riskScore: 8, severity: "low", classification: "likely_safe", createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString() },
  { id: "seed-3", type: "text", preview: "Can you review the project notes tomorrow?", riskScore: 0, severity: "low", classification: "likely_safe", createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
];

const router: IRouter = Router();

router.post("/analyze", (req, res) => {
  const parsed = AnalyzeThreatBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter content to analyze and choose a scan type." });
  const { content, type } = parsed.data as { content: string; type: ScanType };
  const result = analyzeContent(content, type);
  const item: HistoryItem = {
    id: crypto.randomUUID(),
    type,
    preview: content.replace(/\s+/g, " ").trim().slice(0, 88),
    riskScore: result.score,
    severity: result.severity,
    classification: result.classification,
    createdAt: new Date().toISOString(),
  };
  history.unshift(item);
  return res.json({ id: item.id, riskScore: result.score, severity: result.severity, classification: result.classification, indicators: result.indicators, explanation: result.explanation, recommendations: result.recommendations, type, createdAt: item.createdAt });
});

router.get("/history", (_req, res) => res.json(history.slice(0, 20)));

router.get("/dashboard", (_req, res) => {
  const distribution = { safe: 0, low: 0, medium: 0, high: 0, critical: 0 };
  for (const item of history) {
    distribution[item.riskScore < 10 ? "safe" : item.severity as keyof typeof distribution]++;
  }
  const threatsDetected = history.filter((item) => item.riskScore >= 25).length;
  return res.json({ totalScans: history.length, threatsDetected, safeScans: history.length - threatsDetected, highRiskScans: history.filter((item) => item.riskScore >= 50).length, distribution, recent: history.slice(0, 5) });
});

export default router;