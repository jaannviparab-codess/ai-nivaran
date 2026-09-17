import type { IssueSeverity, IssueStatus } from "./types";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Nivaran AI";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

export const MAP_PROVIDER = (process.env.NEXT_PUBLIC_MAP_PROVIDER || "osm") as
  | "osm"
  | "mapbox"
  | "google";

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export const DEFAULT_MAP_CENTER = { lat: 19.076, lng: 72.8777 }; // Mumbai, used only as a fallback default

export const SEVERITY_META: Record<
  IssueSeverity,
  { label: string; color: string; bg: string; text: string; ring: string; dot: string }
> = {
  low: {
    label: "Low",
    color: "#6366f1",
    bg: "bg-primary-50",
    text: "text-primary-700",
    ring: "ring-primary-200",
    dot: "bg-primary-500",
  },
  medium: {
    label: "Medium",
    color: "#f59e0b",
    bg: "bg-warning-50",
    text: "text-warning-600",
    ring: "ring-warning-100",
    dot: "bg-warning-500",
  },
  high: {
    label: "High",
    color: "#d97706",
    bg: "bg-warning-100",
    text: "text-warning-600",
    ring: "ring-warning-100",
    dot: "bg-warning-600",
  },
  critical: {
    label: "Critical",
    color: "#dc2626",
    bg: "bg-critical-50",
    text: "text-critical-600",
    ring: "ring-critical-100",
    dot: "bg-critical-600",
  },
};

export const STATUS_META: Record<
  IssueStatus,
  { label: string; color: string; bg: string; text: string }
> = {
  reported: { label: "Reported", color: "#64748b", bg: "bg-slate-100", text: "text-slate-600" },
  ai_analyzed: { label: "AI Analyzed", color: "#4f46e5", bg: "bg-primary-50", text: "text-primary-700" },
  verified: { label: "Verified", color: "#0891b2", bg: "bg-cyan-50", text: "text-cyan-700" },
  under_review: { label: "Under Review", color: "#f59e0b", bg: "bg-warning-50", text: "text-warning-600" },
  work_started: { label: "Work Started", color: "#7c3aed", bg: "bg-secondary-50", text: "text-secondary-700" },
  resolved: { label: "Resolved", color: "#10b981", bg: "bg-success-50", text: "text-success-700" },
  citizen_verified: { label: "Citizen Verified", color: "#047857", bg: "bg-success-100", text: "text-success-700" },
  reopened: { label: "Reopened", color: "#dc2626", bg: "bg-critical-50", text: "text-critical-600" },
};

export const STATUS_LABELS_MR: Record<IssueStatus, string> = {
  reported: "नोंदवले",
  ai_analyzed: "AI विश्लेषण झाले",
  verified: "पडताळणी झाली",
  under_review: "पुनरावलोकनाधीन",
  work_started: "काम सुरू",
  resolved: "निवारण झाले",
  citizen_verified: "नागरिक पडताळणी",
  reopened: "पुन्हा उघडले",
};

export const SUPPORTED_LANGUAGES = [
  { code: "mr", label: "मराठी", speechCode: "mr-IN" },
  { code: "hi", label: "हिंदी", speechCode: "hi-IN" },
  { code: "en", label: "English", speechCode: "en-IN" },
] as const;
