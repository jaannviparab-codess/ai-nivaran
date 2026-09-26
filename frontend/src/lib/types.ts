// Shared domain types for Nivaran AI.
// These mirror the backend Pydantic schemas 1:1 (see backend/app/schemas)
// so the frontend and API never drift silently.

export type IssueCategory =
  | "pothole"
  | "garbage"
  | "streetlight"
  | "water_leakage"
  | "damaged_road"
  | "open_manhole"
  | "fallen_tree"
  | "road_obstruction"
  | "drainage"
  | "public_cleanliness"
  | "accessibility"
  | "other";

export type IssueSeverity = "low" | "medium" | "high" | "critical";

export type IssueStatus =
  | "reported"
  | "ai_analyzed"
  | "verified"
  | "under_review"
  | "work_started"
  | "resolved"
  | "citizen_verified"
  | "reopened";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface IssueLocation extends GeoPoint {
  address?: string | null;
  ward?: string | null;
  city?: string | null;
  landmark?: string | null;
  locationImportance?: number; // 0-1, used by the priority engine
}

export interface IssueImage {
  id: string;
  url: string;
  kind: "report" | "before" | "after";
  caption?: string | null;
  createdAt: string;
}

export interface AIAnalysis {
  id: string;
  issueId: string;
  detectedCategory: IssueCategory;
  confidence: number; // 0-1
  severity: IssueSeverity;
  safetyRisk: IssueSeverity;
  summary: string;
  possibleCauses: string[]; // always phrased as "possible cause suggested by AI"
  isDemo: boolean;
  modelVersion: string;
  createdAt: string;
}

export interface PriorityFactor {
  label: string;
  weight: number;
  contribution: number; // 0-100 points contributed
  detail: string;
}

export interface PriorityScoreBreakdown {
  score: number; // 0-100
  factors: PriorityFactor[];
  calculatedAt: string;
}

export type StatusStep =
  | "reported"
  | "ai_analyzed"
  | "verified"
  | "under_review"
  | "work_started"
  | "resolved"
  | "citizen_verified";

export interface StatusHistoryEntry {
  id: string;
  status: IssueStatus;
  note?: string | null;
  actor: "system" | "ai" | "citizen" | "authority";
  createdAt: string;
}

export interface IssueConfirmationSummary {
  total: number;
  stillPresent: number;
  resolved: number;
  peopleAffectedEstimate: number;
}

export interface IssueComment {
  id: string;
  issueId: string;
  authorName: string;
  message: string;
  createdAt: string;
}

export interface DuplicateGroupInfo {
  isDuplicateGroup: boolean;
  primaryIssueId: string;
  groupedReportCount: number;
  confirmations: number;
}

export interface IssueResolution {
  resolvedAt: string;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  resolutionNote?: string | null;
  resolvedByLabel?: string | null;
}

export interface Issue {
  id: string;
  trackingId: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  location: IssueLocation;
  images: IssueImage[];
  aiAnalysis?: AIAnalysis | null;
  priorityScore?: PriorityScoreBreakdown | null;
  statusHistory: StatusHistoryEntry[];
  confirmations: IssueConfirmationSummary;
  duplicateInfo?: DuplicateGroupInfo | null;
  resolution?: IssueResolution | null;
  reportedAt: string;
  updatedAt: string;
  daysOpen: number;
  reporterDisplayName?: string | null;
  isDemo?: boolean;
}

export interface IssueListItem {
  id: string;
  trackingId: string;
  title: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  location: GeoPoint;
  priorityScore: number;
  confirmationCount: number;
  reportedAt: string;
  thumbnailUrl?: string | null;
}

export interface IssueFilters {
  category?: IssueCategory[];
  severity?: IssueSeverity[];
  status?: IssueStatus[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  ward?: string;
}

export interface CreateIssuePayload {
  title: string;
  description: string;
  category?: IssueCategory; // optional -- AI will suggest one if omitted
  location: IssueLocation;
  imageBase64?: string | null;
  voiceTranscript?: string | null;
  language?: "mr" | "hi" | "en";
  reporterDisplayName?: string | null;
  reporterContact?: string | null;
  isPublic?: boolean;
}

export interface DashboardStats {
  totalReports: number;
  activeIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  avgResolutionDays: number;
  reportsThisMonth: number;
  communityConfirmations: number;
}

export interface CategoryBreakdown {
  category: IssueCategory;
  count: number;
}

export interface AreaBreakdown {
  ward: string;
  count: number;
  resolvedCount: number;
}

export interface MonthlyTrendPoint {
  month: string;
  reported: number;
  resolved: number;
}

export interface AnalyticsSnapshot {
  stats: DashboardStats;
  byCategory: CategoryBreakdown[];
  byArea: AreaBreakdown[];
  monthlyTrend: MonthlyTrendPoint[];
  resolvedVsActive: { resolved: number; active: number };
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: "citizen" | "moderator" | "admin";
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  suggestedActions?: { label: string; href: string }[];
}

export interface ApiError {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

export const ISSUE_CATEGORIES: { value: IssueCategory; labelEn: string; labelMr: string; icon: string }[] = [
  { value: "pothole", labelEn: "Pothole", labelMr: "खड्डा", icon: "circle-dashed" },
  { value: "garbage", labelEn: "Garbage / Waste", labelMr: "कचरा", icon: "trash-2" },
  { value: "streetlight", labelEn: "Broken Streetlight", labelMr: "पथदिवा बंद", icon: "lamp" },
  { value: "water_leakage", labelEn: "Water Leakage", labelMr: "पाणी गळती", icon: "droplets" },
  { value: "damaged_road", labelEn: "Damaged Road", labelMr: "रस्ता नादुरुस्त", icon: "road" },
  { value: "open_manhole", labelEn: "Open Manhole", labelMr: "उघडे मॅनहोल", icon: "octagon-alert" },
  { value: "fallen_tree", labelEn: "Fallen Tree", labelMr: "पडलेले झाड", icon: "trees" },
  { value: "road_obstruction", labelEn: "Road Obstruction", labelMr: "रस्ता अडथळा", icon: "construction" },
  { value: "drainage", labelEn: "Drainage Problem", labelMr: "गटार समस्या", icon: "waves" },
  { value: "public_cleanliness", labelEn: "Public Cleanliness", labelMr: "सार्वजनिक स्वच्छता", icon: "sparkles" },
  { value: "accessibility", labelEn: "Accessibility Issue", labelMr: "प्रवेशयोग्यता समस्या", icon: "accessibility" },
  { value: "other", labelEn: "Other", labelMr: "इतर", icon: "help-circle" },
];

export const ISSUE_STATUS_STEPS: StatusStep[] = [
  "reported",
  "ai_analyzed",
  "verified",
  "under_review",
  "work_started",
  "resolved",
  "citizen_verified",
];
