import { API_BASE_URL, DEMO_MODE } from "./constants";
import {
  MOCK_ANALYTICS,
  MOCK_ISSUES,
  MOCK_ISSUE_LIST,
  MOCK_STATS,
  getAssistantReply,
  toListItem,
} from "./mock-data";
import { categoryPlaceholderImage } from "./placeholder";
import type {
  AIAnalysis,
  AnalyticsSnapshot,
  AuthResponse,
  ChatMessage,
  CreateIssuePayload,
  DashboardStats,
  DuplicateGroupInfo,
  Issue,
  IssueCategory,
  IssueFilters,
  IssueListItem,
  IssueSeverity,
  PriorityScoreBreakdown,
  User,
} from "./types";
import { ISSUE_CATEGORIES, ISSUE_STATUS_STEPS } from "./types";
import { generateTrackingId } from "./utils";

const DEMO_LATENCY_MS = 500;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Thin fetch wrapper. In demo mode (default, no backend required) it never
 * touches the network. Outside demo mode it calls the real FastAPI backend,
 * and transparently falls back to demo data if that call fails, so the app
 * never shows a broken page just because the API is unreachable.
 */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return res.json();
}

async function withDemoFallback<T>(path: string, init: RequestInit | undefined, demoFn: () => Promise<T> | T): Promise<T> {
  if (DEMO_MODE) return demoFn();
  try {
    return await apiFetch<T>(path, init);
  } catch {
    return demoFn();
  }
}

// ---------------------------------------------------------------------------
// Issues
// ---------------------------------------------------------------------------

export async function getIssues(filters?: IssueFilters): Promise<IssueListItem[]> {
  return withDemoFallback(`/issues${toQuery(filters)}`, undefined, async () => {
    await wait(DEMO_LATENCY_MS);
    return filterMockList(filters);
  });
}

export async function getIssueMapData(filters?: IssueFilters): Promise<IssueListItem[]> {
  return withDemoFallback(`/issues/map${toQuery(filters)}`, undefined, async () => {
    await wait(200);
    return filterMockList(filters);
  });
}

function filterMockList(filters?: IssueFilters): IssueListItem[] {
  let list = MOCK_ISSUE_LIST;
  if (!filters) return list;
  if (filters.category?.length) list = list.filter((i) => filters.category!.includes(i.category));
  if (filters.severity?.length) list = list.filter((i) => filters.severity!.includes(i.severity));
  if (filters.status?.length) list = list.filter((i) => filters.status!.includes(i.status));
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((i) => i.title.toLowerCase().includes(q) || i.trackingId.toLowerCase().includes(q));
  }
  return list;
}

function toQuery(filters?: IssueFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.category?.length) params.set("category", filters.category.join(","));
  if (filters.severity?.length) params.set("severity", filters.severity.join(","));
  if (filters.status?.length) params.set("status", filters.status.join(","));
  if (filters.search) params.set("search", filters.search);
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function getIssueById(id: string): Promise<Issue | null> {
  return withDemoFallback(`/issues/${id}`, undefined, async () => {
    await wait(DEMO_LATENCY_MS);
    return MOCK_ISSUES.find((i) => i.id === id) || null;
  });
}

export async function getIssueByTrackingId(trackingId: string): Promise<Issue | null> {
  return withDemoFallback(`/issues/track/${trackingId}`, undefined, async () => {
    await wait(DEMO_LATENCY_MS);
    return (
      MOCK_ISSUES.find((i) => i.trackingId.toLowerCase() === trackingId.trim().toLowerCase()) || null
    );
  });
}

export interface DraftAnalysisResult {
  analysis: AIAnalysis;
  priority: PriorityScoreBreakdown;
  possibleDuplicates: IssueListItem[];
  suggestedTitle: string;
}

const CATEGORY_KEYWORDS: [IssueCategory, string[]][] = [
  ["pothole", ["pothole", "khadda", "खड्डा", "गड्ढा"]],
  ["garbage", ["garbage", "waste", "trash", "kachra", "कचरा"]],
  ["streetlight", ["streetlight", "street light", "lamp", "दिवा", "pathdiva"]],
  ["water_leakage", ["water leak", "pipeline", "leakage", "पाणी गळती"]],
  ["open_manhole", ["manhole", "मॅनहोल"]],
  ["fallen_tree", ["tree", "झाड"]],
  ["drainage", ["drain", "gutter", "गटार", "sewage"]],
  ["road_obstruction", ["obstruction", "debris", "blocked", "अडथळा"]],
  ["damaged_road", ["road damage", "broken road", "रस्ता"]],
  ["public_cleanliness", ["dirty", "unhygienic", "स्वच्छता", "toilet"]],
  ["accessibility", ["wheelchair", "ramp", "accessibility", "दिव्यांग"]],
];

const URGENT_KEYWORDS = ["accident", "danger", "urgent", "critical", "injur", "risk", "धोका", "अपघात"];

function classifyFromText(description: string, fallback?: IssueCategory): { category: IssueCategory; confidence: number } {
  const text = description.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => text.includes(k.toLowerCase()))) {
      return { category, confidence: 0.9 };
    }
  }
  return { category: fallback || "other", confidence: fallback ? 0.75 : 0.55 };
}

function estimateSeverity(description: string, category: IssueCategory): IssueSeverity {
  const text = description.toLowerCase();
  if (URGENT_KEYWORDS.some((k) => text.includes(k))) return "critical";
  if (["open_manhole", "fallen_tree"].includes(category)) return "high";
  if (text.length > 180) return "high";
  if (text.length > 80) return "medium";
  return "medium";
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * Runs the multi-step "AI analysis" used on the Report page: category
 * classification, severity + safety-risk estimation, priority scoring and
 * duplicate detection against nearby existing reports. In demo mode this is
 * a deterministic, transparent simulation — never presented as a verified
 * real-world assessment.
 */
export async function analyzeIssueDraft(payload: CreateIssuePayload): Promise<DraftAnalysisResult> {
  return withDemoFallback(`/issues/analyze`, { method: "POST", body: JSON.stringify(payload) }, async () => {
    await wait(900);
    const { category, confidence } = classifyFromText(payload.description, payload.category);
    const severity = estimateSeverity(payload.description, category);
    const categoryMeta = ISSUE_CATEGORIES.find((c) => c.value === category)!;

    const nearbyDuplicates = MOCK_ISSUES.filter(
      (i) =>
        i.category === category &&
        i.status !== "resolved" &&
        haversineMeters(i.location, payload.location) < 350
    );

    const analysis: AIAnalysis = {
      id: `draft-ai-${Date.now()}`,
      issueId: "draft",
      detectedCategory: category,
      confidence,
      severity,
      safetyRisk: severity === "critical" ? "critical" : severity === "high" ? "high" : "medium",
      summary: `AI detected a likely ${categoryMeta.labelEn.toLowerCase()} issue from your photo and description.`,
      possibleCauses: [
        `Possible cause suggested by AI: ${demoRootCause(category)}`,
      ],
      isDemo: true,
      modelVersion: "nivaran-vision-demo-v1",
      createdAt: new Date().toISOString(),
    };

    const severityPoints: Record<IssueSeverity, number> = { low: 20, medium: 45, high: 72, critical: 95 };
    const affectedEstimate = nearbyDuplicates.reduce((sum, i) => sum + i.confirmations.total, 0) + 1;
    const priority: PriorityScoreBreakdown = {
      score: Math.min(97, Math.round(severityPoints[severity] * 0.55 + Math.min(affectedEstimate, 50) * 0.9)),
      calculatedAt: new Date().toISOString(),
      factors: [
        { label: "Severity", weight: 0.3, contribution: Math.round(severityPoints[severity] * 0.3), detail: `AI classified this as ${severity} severity.` },
        { label: "Safety risk", weight: 0.25, contribution: Math.round(severityPoints[severity] * 0.25), detail: "Estimated potential for accident or injury." },
        { label: "People affected", weight: 0.2, contribution: Math.min(20, affectedEstimate), detail: `Estimated ${affectedEstimate} people affected nearby.` },
        { label: "Duration open", weight: 0.15, contribution: 2, detail: "Newly reported issue." },
        { label: "Location importance", weight: 0.1, contribution: 6, detail: "Based on surrounding report density." },
      ],
    };

    return {
      analysis,
      priority,
      possibleDuplicates: nearbyDuplicates.map(toListItem),
      suggestedTitle: `${categoryMeta.labelEn} reported near ${payload.location.ward || payload.location.address || "your location"}`,
    };
  });
}

function demoRootCause(category: IssueCategory): string {
  const map: Record<IssueCategory, string> = {
    pothole: "water accumulation weakening the road surface over time.",
    garbage: "an irregular waste-collection schedule in this area.",
    streetlight: "an electrical fault in the fixture or wiring.",
    water_leakage: "an aging or cracked underground pipeline.",
    damaged_road: "prolonged wear combined with heavy rainfall.",
    open_manhole: "a missing or displaced manhole cover.",
    fallen_tree: "root instability aggravated by recent winds.",
    road_obstruction: "material left on-site without proper clearance.",
    drainage: "a drain that is undersized for local rainfall.",
    public_cleanliness: "inconsistent sanitation coverage in the area.",
    accessibility: "the original design not accounting for accessible access.",
    other: "insufficient information — manual review recommended.",
  };
  return map[category];
}

export async function createIssue(payload: CreateIssuePayload, draft?: DraftAnalysisResult): Promise<Issue> {
  return withDemoFallback(`/issues`, { method: "POST", body: JSON.stringify(payload) }, async () => {
    await wait(700);
    const category = draft?.analysis.detectedCategory || payload.category || "other";
    const severity = draft?.analysis.severity || "medium";
    const categoryMeta = ISSUE_CATEGORIES.find((c) => c.value === category)!;
    const id = `local-${Date.now()}`;

    const issue: Issue = {
      id,
      trackingId: generateTrackingId(),
      title: payload.title || draft?.suggestedTitle || `${categoryMeta.labelEn} report`,
      description: payload.description,
      category,
      severity,
      status: "ai_analyzed",
      location: payload.location,
      images: payload.imageBase64
        ? [{ id: `${id}-img`, url: payload.imageBase64, kind: "report", createdAt: new Date().toISOString() }]
        : [{ id: `${id}-img`, url: categoryPlaceholderImage(category, categoryMeta.labelEn), kind: "report", createdAt: new Date().toISOString() }],
      aiAnalysis: draft?.analysis || null,
      priorityScore: draft?.priority || null,
      statusHistory: [
        { id: "s1", status: "reported", actor: "citizen", note: "Report submitted by citizen.", createdAt: new Date().toISOString() },
        { id: "s2", status: "ai_analyzed", actor: "ai", note: "AI classified the issue and generated a priority estimate.", createdAt: new Date().toISOString() },
      ],
      confirmations: { total: 1, stillPresent: 1, resolved: 0, peopleAffectedEstimate: draft?.possibleDuplicates.length ? draft.possibleDuplicates.length * 8 : 1 },
      duplicateInfo: draft?.possibleDuplicates.length
        ? { isDuplicateGroup: true, primaryIssueId: draft.possibleDuplicates[0].id, groupedReportCount: draft.possibleDuplicates.length + 1, confirmations: draft.possibleDuplicates.length + 1 }
        : null,
      resolution: null,
      reportedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      daysOpen: 0,
      reporterDisplayName: payload.reporterDisplayName || "Anonymous Citizen",
      isDemo: true,
    };

    MOCK_ISSUES.unshift(issue);
    MOCK_ISSUE_LIST.unshift(toListItem(issue));
    return issue;
  });
}

export async function confirmIssue(id: string, stillPresent: boolean): Promise<{ confirmations: number }> {
  return withDemoFallback(`/issues/${id}/confirm`, { method: "POST", body: JSON.stringify({ stillPresent }) }, async () => {
    await wait(400);
    const issue = MOCK_ISSUES.find((i) => i.id === id);
    if (issue) {
      issue.confirmations.total += 1;
      if (stillPresent) issue.confirmations.stillPresent += 1;
      else issue.confirmations.resolved += 1;
    }
    return { confirmations: issue?.confirmations.total ?? 0 };
  });
}

export async function verifyIssueResolution(id: string, confirmed: boolean): Promise<void> {
  return withDemoFallback(`/issues/${id}/verify`, { method: "POST", body: JSON.stringify({ confirmed }) }, async () => {
    await wait(400);
    const issue = MOCK_ISSUES.find((i) => i.id === id);
    if (issue && confirmed) {
      issue.status = "citizen_verified";
    } else if (issue && !confirmed) {
      issue.status = "reopened";
    }
  });
}

// ---------------------------------------------------------------------------
// Stats & analytics
// ---------------------------------------------------------------------------

export async function getStats(): Promise<DashboardStats> {
  return withDemoFallback(`/issues/stats`, undefined, async () => {
    await wait(400);
    return MOCK_STATS;
  });
}

export async function getAnalytics(): Promise<AnalyticsSnapshot> {
  return withDemoFallback(`/analytics`, undefined, async () => {
    await wait(500);
    return MOCK_ANALYTICS;
  });
}

// ---------------------------------------------------------------------------
// AI Assistant
// ---------------------------------------------------------------------------

export async function sendAssistantMessage(text: string): Promise<ChatMessage> {
  return withDemoFallback(`/assistant/chat`, { method: "POST", body: JSON.stringify({ message: text }) }, async () => {
    await wait(600);
    return getAssistantReply(text);
  });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

// Demo mode has no real backend/database, but a citizen who just registered
// and then logs in should still see the same name they signed up with — so
// registrations are remembered locally (this browser only) and consulted on
// the next demo login instead of always re-deriving a name from the email.
const DEMO_USERS_KEY = "nvr_demo_users";

function rememberDemoUser(email: string, displayName: string) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(DEMO_USERS_KEY);
  const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  map[email.toLowerCase()] = displayName;
  window.localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(map));
}

function recallDemoUser(email: string): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DEMO_USERS_KEY);
  if (!raw) return null;
  const map = JSON.parse(raw) as Record<string, string>;
  return map[email.toLowerCase()] ?? null;
}

// Auth deliberately does NOT use withDemoFallback: that helper treats any
// real-API failure as "fall back to demo data", which is right for read
// endpoints but wrong here — a wrong password must surface as a real error,
// never be silently swallowed into an always-succeeds demo login.
export async function login(email: string, password: string): Promise<AuthResponse> {
  if (DEMO_MODE) {
    await wait(500);
    const displayName = recallDemoUser(email) || email.split("@")[0];
    const user: User = { id: "demo-user", email, displayName, role: "citizen", createdAt: new Date().toISOString() };
    return { user, accessToken: "demo-token" };
  }
  return apiFetch<AuthResponse>(`/auth/login`, { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function register(payload: { email: string; password: string; displayName: string; phone?: string }): Promise<AuthResponse> {
  if (DEMO_MODE) {
    await wait(500);
    rememberDemoUser(payload.email, payload.displayName);
    const user: User = { id: "demo-user", email: payload.email, displayName: payload.displayName, role: "citizen", createdAt: new Date().toISOString() };
    return { user, accessToken: "demo-token" };
  }
  return apiFetch<AuthResponse>(`/auth/register`, { method: "POST", body: JSON.stringify(payload) });
}

export { ISSUE_STATUS_STEPS };
