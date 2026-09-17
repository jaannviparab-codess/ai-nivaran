import type {
  AnalyticsSnapshot,
  ChatMessage,
  DashboardStats,
  DuplicateGroupInfo,
  Issue,
  IssueCategory,
  IssueListItem,
  IssueSeverity,
  IssueStatus,
  PriorityScoreBreakdown,
  StatusHistoryEntry,
} from "./types";
import { ISSUE_CATEGORIES, ISSUE_STATUS_STEPS } from "./types";
import { categoryPlaceholderImage } from "./placeholder";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function categoryLabel(category: IssueCategory): string {
  return ISSUE_CATEGORIES.find((c) => c.value === category)?.labelEn || category;
}

function buildStatusHistory(status: IssueStatus, reportedDaysAgo: number): StatusHistoryEntry[] {
  const steps = ISSUE_STATUS_STEPS;
  const currentIndex = Math.max(steps.indexOf(status as any), 0);
  const activeSteps = status === "reopened" ? steps.slice(0, 6) : steps.slice(0, currentIndex + 1);
  const span = Math.max(reportedDaysAgo, activeSteps.length);
  return activeSteps.map((step, i) => ({
    id: `${step}-${i}`,
    status: step as IssueStatus,
    actor: step === "reported" ? "citizen" : step === "ai_analyzed" ? "ai" : step === "resolved" ? "authority" : i % 2 === 0 ? "authority" : "system",
    note: STATUS_NOTES[step as IssueStatus],
    createdAt: daysAgo(Math.max(span - Math.floor((span / activeSteps.length) * i), 0)),
  }));
}

const STATUS_NOTES: Record<IssueStatus, string> = {
  reported: "Citizen submitted this report with photo and location.",
  ai_analyzed: "AI classified the issue and generated an initial priority estimate.",
  verified: "Report reviewed and confirmed as a valid public issue.",
  under_review: "Assigned to the relevant department for review.",
  work_started: "Field team has started resolution work.",
  resolved: "Issue marked resolved with after-photo evidence.",
  citizen_verified: "Citizens confirmed the fix is holding.",
  reopened: "Multiple citizens reported the issue is still present — reopened for review.",
};

interface MockIssueSeed {
  title: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  ward: string;
  lat: number;
  lng: number;
  reportedDaysAgo: number;
  confirmations: number;
  peopleAffected: number;
  description: string;
  duplicate?: DuplicateGroupInfo;
}

const SEEDS: MockIssueSeed[] = [
  {
    title: "Large pothole near Main Road signal",
    category: "pothole",
    severity: "high",
    status: "work_started",
    ward: "Kothrud",
    lat: 18.5074,
    lng: 73.8077,
    reportedDaysAgo: 12,
    confirmations: 47,
    peopleAffected: 200,
    description:
      "A deep pothole has formed right after the Main Road signal, causing two-wheelers to swerve into oncoming traffic, especially dangerous after dark.",
    duplicate: { isDuplicateGroup: true, primaryIssueId: "issue-1", groupedReportCount: 6, confirmations: 47 },
  },
  {
    title: "Garbage pile not collected for a week",
    category: "garbage",
    severity: "medium",
    status: "under_review",
    ward: "Shivajinagar",
    lat: 18.5308,
    lng: 73.8475,
    reportedDaysAgo: 6,
    confirmations: 22,
    peopleAffected: 80,
    description: "Household waste is piling up near the society gate and has not been collected for over a week, attracting stray animals.",
  },
  {
    title: "Streetlight pole completely dark",
    category: "streetlight",
    severity: "medium",
    status: "verified",
    ward: "Aundh",
    lat: 18.5629,
    lng: 73.8072,
    reportedDaysAgo: 4,
    confirmations: 9,
    peopleAffected: 60,
    description: "Three consecutive streetlight poles are non-functional, making the stretch unsafe for pedestrians at night.",
  },
  {
    title: "Water pipeline leaking onto footpath",
    category: "water_leakage",
    severity: "high",
    status: "reported",
    ward: "Kharadi",
    lat: 18.5515,
    lng: 73.9345,
    reportedDaysAgo: 1,
    confirmations: 3,
    peopleAffected: 40,
    description: "Continuous water leakage from an underground pipeline is flooding the footpath and wasting significant water daily.",
  },
  {
    title: "Open manhole without barricade",
    category: "open_manhole",
    severity: "critical",
    status: "ai_analyzed",
    ward: "Hadapsar",
    lat: 18.5089,
    lng: 73.9260,
    reportedDaysAgo: 1,
    confirmations: 15,
    peopleAffected: 150,
    description: "An open manhole with no barricade or warning sign poses a serious fall risk, especially at night. Immediate attention required.",
  },
  {
    title: "Fallen tree blocking half the road",
    category: "fallen_tree",
    severity: "critical",
    status: "resolved",
    ward: "Baner",
    lat: 18.5590,
    lng: 73.7868,
    reportedDaysAgo: 20,
    confirmations: 31,
    peopleAffected: 300,
    description: "Heavy winds brought down a large tree which is blocking one lane of traffic completely.",
  },
  {
    title: "Debris and construction material blocking lane",
    category: "road_obstruction",
    severity: "medium",
    status: "under_review",
    ward: "Viman Nagar",
    lat: 18.5679,
    lng: 73.9143,
    reportedDaysAgo: 5,
    confirmations: 11,
    peopleAffected: 70,
    description: "Construction debris has been left unattended on the road for several days, narrowing the usable lane width.",
  },
  {
    title: "Clogged drain causing waterlogging",
    category: "drainage",
    severity: "high",
    status: "work_started",
    ward: "Camp",
    lat: 18.5122,
    lng: 73.8797,
    reportedDaysAgo: 9,
    confirmations: 26,
    peopleAffected: 120,
    description: "A blocked storm drain causes ankle-deep waterlogging every time it rains, affecting shopkeepers and pedestrians.",
  },
  {
    title: "Public toilet area extremely unhygienic",
    category: "public_cleanliness",
    severity: "medium",
    status: "reported",
    ward: "Swargate",
    lat: 18.5010,
    lng: 73.8636,
    reportedDaysAgo: 2,
    confirmations: 7,
    peopleAffected: 90,
    description: "The public toilet block near the bus stand has not been cleaned in days and lacks running water.",
  },
  {
    title: "No wheelchair ramp at pedestrian crossing",
    category: "accessibility",
    severity: "medium",
    status: "citizen_verified",
    ward: "Deccan",
    lat: 18.5158,
    lng: 73.8412,
    reportedDaysAgo: 30,
    confirmations: 18,
    peopleAffected: 50,
    description: "The pedestrian crossing near the college lacks a wheelchair ramp, forcing wheelchair users onto the main carriageway.",
  },
  {
    title: "Deep pothole cluster after flyover",
    category: "pothole",
    severity: "critical",
    status: "reopened",
    ward: "Wakad",
    lat: 18.5993,
    lng: 73.7625,
    reportedDaysAgo: 25,
    confirmations: 63,
    peopleAffected: 400,
    description: "A cluster of deep potholes right after the flyover exit has caused several two-wheeler accidents. Previously marked resolved but citizens report it has reappeared.",
  },
  {
    title: "Overflowing garbage bin near market",
    category: "garbage",
    severity: "low",
    status: "resolved",
    ward: "Kothrud",
    lat: 18.5030,
    lng: 73.8120,
    reportedDaysAgo: 15,
    confirmations: 12,
    peopleAffected: 55,
    description: "The community garbage bin near the vegetable market overflows daily by the afternoon.",
  },
  {
    title: "Broken footpath tiles causing trips",
    category: "damaged_road",
    severity: "low",
    status: "verified",
    ward: "Erandwane",
    lat: 18.5049,
    lng: 73.8291,
    reportedDaysAgo: 3,
    confirmations: 5,
    peopleAffected: 35,
    description: "Several footpath tiles are broken or missing, creating a tripping hazard for elderly pedestrians.",
  },
  {
    title: "Street flooding due to poor drainage design",
    category: "drainage",
    severity: "high",
    status: "under_review",
    ward: "Hadapsar",
    lat: 18.4967,
    lng: 73.9394,
    reportedDaysAgo: 8,
    confirmations: 34,
    peopleAffected: 210,
    description: "Even light rain causes this stretch to flood ankle-deep within minutes due to an undersized drain.",
  },
];

function priorityFromSeed(seed: MockIssueSeed): PriorityScoreBreakdown {
  const severityPoints: Record<IssueSeverity, number> = { low: 20, medium: 45, high: 72, critical: 95 };
  const safetyPoints: Record<IssueSeverity, number> = { low: 15, medium: 40, high: 68, critical: 92 };
  const affectedPoints = Math.min(100, Math.round((seed.peopleAffected / 400) * 100));
  const durationPoints = Math.min(100, Math.round((seed.reportedDaysAgo / 30) * 100));
  const locationPoints = seed.severity === "critical" ? 80 : 55;

  const weights = { severity: 0.3, safety: 0.25, affected: 0.2, duration: 0.15, location: 0.1 };
  const score = Math.round(
    severityPoints[seed.severity] * weights.severity +
      safetyPoints[seed.severity] * weights.safety +
      affectedPoints * weights.affected +
      durationPoints * weights.duration +
      locationPoints * weights.location
  );

  return {
    score: Math.min(99, score),
    calculatedAt: daysAgo(0),
    factors: [
      {
        label: "Severity",
        weight: weights.severity,
        contribution: Math.round(severityPoints[seed.severity] * weights.severity),
        detail: `Classified as ${seed.severity} severity by AI analysis.`,
      },
      {
        label: "Safety risk",
        weight: weights.safety,
        contribution: Math.round(safetyPoints[seed.severity] * weights.safety),
        detail: "Potential for injury or accident if left unresolved.",
      },
      {
        label: "People affected",
        weight: weights.affected,
        contribution: Math.round(affectedPoints * weights.affected),
        detail: `Estimated ${seed.peopleAffected}+ residents affected in the vicinity.`,
      },
      {
        label: "Duration open",
        weight: weights.duration,
        contribution: Math.round(durationPoints * weights.duration),
        detail: `Reported ${seed.reportedDaysAgo} day${seed.reportedDaysAgo === 1 ? "" : "s"} ago and still unresolved.`,
      },
      {
        label: "Location importance",
        weight: weights.location,
        contribution: Math.round(locationPoints * weights.location),
        detail: "Located near a high-footfall or high-traffic area.",
      },
    ],
  };
}

export const MOCK_ISSUES: Issue[] = SEEDS.map((seed, index) => {
  const id = `issue-${index + 1}`;
  const trackingId = `NVR-2026-${(1000 + index).toString().slice(-4)}`;
  const label = categoryLabel(seed.category);
  const isResolvedLike = seed.status === "resolved" || seed.status === "citizen_verified";

  return {
    id,
    trackingId,
    title: seed.title,
    description: seed.description,
    category: seed.category,
    severity: seed.severity,
    status: seed.status,
    location: {
      lat: seed.lat,
      lng: seed.lng,
      ward: seed.ward,
      city: "Pune",
      address: `Near ${seed.ward} main road, Pune`,
      locationImportance: seed.severity === "critical" ? 0.9 : 0.6,
    },
    images: [
      {
        id: `${id}-img-1`,
        url: categoryPlaceholderImage(seed.category, label, "report"),
        kind: "report",
        caption: `Photo submitted with the report`,
        createdAt: daysAgo(seed.reportedDaysAgo),
      },
    ],
    aiAnalysis: {
      id: `${id}-ai`,
      issueId: id,
      detectedCategory: seed.category,
      confidence: 0.82 + (index % 5) * 0.03,
      severity: seed.severity,
      safetyRisk: seed.severity === "critical" ? "critical" : seed.severity === "high" ? "high" : "medium",
      summary: `AI detected a ${label.toLowerCase()} issue with ${seed.severity} severity based on the submitted photo and description.`,
      possibleCauses: possibleCausesFor(seed.category),
      isDemo: true,
      modelVersion: "nivaran-vision-demo-v1",
      createdAt: daysAgo(seed.reportedDaysAgo),
    },
    priorityScore: priorityFromSeed(seed),
    statusHistory: buildStatusHistory(seed.status, seed.reportedDaysAgo),
    confirmations: {
      total: seed.confirmations,
      stillPresent: isResolvedLike ? Math.round(seed.confirmations * 0.1) : seed.confirmations,
      resolved: isResolvedLike ? Math.round(seed.confirmations * 0.9) : 0,
      peopleAffectedEstimate: seed.peopleAffected,
    },
    duplicateInfo: seed.duplicate || null,
    resolution: isResolvedLike
      ? {
          resolvedAt: daysAgo(Math.max(seed.reportedDaysAgo - 4, 0)),
          beforeImageUrl: categoryPlaceholderImage(seed.category, label, "before"),
          afterImageUrl: categoryPlaceholderImage(seed.category, "Resolved", "after"),
          resolutionNote: "Field team completed the repair and closed out the work order.",
          resolvedByLabel: "Public Works Field Team",
        }
      : null,
    reportedAt: daysAgo(seed.reportedDaysAgo),
    updatedAt: daysAgo(Math.max(seed.reportedDaysAgo - 1, 0)),
    daysOpen: isResolvedLike ? 0 : seed.reportedDaysAgo,
    reporterDisplayName: "Anonymous Citizen",
    isDemo: true,
  };
});

function possibleCausesFor(category: IssueCategory): string[] {
  const map: Record<IssueCategory, string[]> = {
    pothole: [
      "Possible cause suggested by AI: prolonged water accumulation weakening the road surface.",
      "Possible cause suggested by AI: heavy vehicle load on an aging road patch.",
    ],
    garbage: [
      "Possible cause suggested by AI: missed or irregular collection schedule.",
      "Possible cause suggested by AI: insufficient bin capacity for the area.",
    ],
    streetlight: [
      "Possible cause suggested by AI: electrical fault or blown fixture.",
      "Possible cause suggested by AI: damaged wiring following recent weather.",
    ],
    water_leakage: ["Possible cause suggested by AI: aging or cracked underground pipeline."],
    damaged_road: ["Possible cause suggested by AI: erosion from continuous heavy rainfall."],
    open_manhole: ["Possible cause suggested by AI: missing or stolen manhole cover."],
    fallen_tree: ["Possible cause suggested by AI: root instability combined with high winds."],
    road_obstruction: ["Possible cause suggested by AI: construction material left without clearance."],
    drainage: ["Possible cause suggested by AI: undersized drain relative to rainfall volume."],
    public_cleanliness: ["Possible cause suggested by AI: irregular sanitation staff rotation."],
    accessibility: ["Possible cause suggested by AI: original construction did not include ramp access."],
    other: ["Possible cause suggested by AI: requires manual review to determine root cause."],
  };
  return map[category];
}

export function toListItem(issue: Issue): IssueListItem {
  return {
    id: issue.id,
    trackingId: issue.trackingId,
    title: issue.title,
    category: issue.category,
    severity: issue.severity,
    status: issue.status,
    location: { lat: issue.location.lat, lng: issue.location.lng },
    priorityScore: issue.priorityScore?.score ?? 0,
    confirmationCount: issue.confirmations.total,
    reportedAt: issue.reportedAt,
    thumbnailUrl: issue.images[0]?.url,
  };
}

export const MOCK_ISSUE_LIST: IssueListItem[] = MOCK_ISSUES.map(toListItem);

export const MOCK_STATS: DashboardStats = {
  totalReports: 1284,
  activeIssues: 342,
  resolvedIssues: 918,
  criticalIssues: 27,
  avgResolutionDays: 6.4,
  reportsThisMonth: 156,
  communityConfirmations: 5218,
};

export const MOCK_ANALYTICS: AnalyticsSnapshot = {
  stats: MOCK_STATS,
  byCategory: [
    { category: "pothole", count: 312 },
    { category: "garbage", count: 258 },
    { category: "streetlight", count: 164 },
    { category: "drainage", count: 140 },
    { category: "water_leakage", count: 112 },
    { category: "road_obstruction", count: 96 },
    { category: "open_manhole", count: 54 },
    { category: "fallen_tree", count: 48 },
    { category: "public_cleanliness", count: 62 },
    { category: "accessibility", count: 38 },
  ],
  byArea: [
    { ward: "Kothrud", count: 142, resolvedCount: 98 },
    { ward: "Hadapsar", count: 128, resolvedCount: 76 },
    { ward: "Kharadi", count: 110, resolvedCount: 70 },
    { ward: "Baner", count: 96, resolvedCount: 61 },
    { ward: "Wakad", count: 88, resolvedCount: 40 },
    { ward: "Shivajinagar", count: 84, resolvedCount: 58 },
    { ward: "Aundh", count: 76, resolvedCount: 52 },
    { ward: "Viman Nagar", count: 64, resolvedCount: 39 },
  ],
  monthlyTrend: [
    { month: "Apr", reported: 96, resolved: 80 },
    { month: "May", reported: 110, resolved: 92 },
    { month: "Jun", reported: 128, resolved: 101 },
    { month: "Jul", reported: 142, resolved: 118 },
    { month: "Aug", reported: 134, resolved: 122 },
    { month: "Sep", reported: 156, resolved: 109 },
  ],
  resolvedVsActive: { resolved: 918, active: 342 },
};

export function getAssistantReply(userText: string): ChatMessage {
  const text = userText.toLowerCase();
  let content =
    "I can help you report a new problem, track an existing report using its tracking ID, or explain how priority scores are calculated. What would you like to do?";
  let suggestedActions: ChatMessage["suggestedActions"] = [
    { label: "Report a problem", href: "/report" },
    { label: "Track an issue", href: "/track" },
  ];

  if (text.includes("priority")) {
    content =
      "Priority Score (0–100) is an AI estimate combining severity, safety risk, number of people affected, how long the issue has been open, and location importance. It helps sort issues, but it is a suggestion — not an official government decision.";
    suggestedActions = [{ label: "View public map", href: "/map" }];
  } else if (text.includes("duplicate")) {
    content =
      "When multiple citizens report what looks like the same problem in the same area, Nivaran AI groups them into a single issue instead of creating duplicates, so confirmations add up on one tracking ID rather than being split across several.";
  } else if (text.includes("report") || text.includes("पोस्ट") || text.includes("submit")) {
    content =
      "To report a problem: open 'Report a Problem', add a photo, allow location access (you can adjust the pin), then add a short description or use voice reporting in Marathi, Hindi or English. AI will suggest a category and severity before you submit.";
    suggestedActions = [{ label: "Go to Report a Problem", href: "/report" }];
  } else if (text.includes("track") || text.includes("status")) {
    content =
      "You can track any report using the tracking ID you received after submitting (format NVR-YYYY-XXXX). The tracker shows the live status timeline, priority score, and any resolution evidence.";
    suggestedActions = [{ label: "Open Track Issue", href: "/track" }];
  }

  return {
    id: `msg-${Date.now()}`,
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
    suggestedActions,
  };
}
