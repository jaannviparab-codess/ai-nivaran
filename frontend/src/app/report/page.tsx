"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, ClipboardCopy, MapIcon, PenLine, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { UploadZone } from "@/components/report/UploadZone";
import { VoiceRecorder } from "@/components/report/VoiceRecorder";
import { LocationPicker } from "@/components/report/LocationPicker";
import { ScanningAnimation } from "@/components/report/ScanningAnimation";
import { PossibleDuplicatesList } from "@/components/report/PossibleDuplicatesList";
import { AIAnalysisCard } from "@/components/issues/AIAnalysisCard";
import { ISSUE_CATEGORIES } from "@/lib/types";
import type { CreateIssuePayload, Issue, IssueCategory, IssueLocation } from "@/lib/types";
import { analyzeIssueDraft, createIssue, type DraftAnalysisResult } from "@/lib/api";
import { DEFAULT_MAP_CENTER } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";
import { useAuth } from "@/lib/auth-context";

type Stage = "form" | "analyzing" | "result" | "success";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ReportPage() {
  useDocumentTitle("Report a Problem");
  const { show } = useToast();
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>("form");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory | null>(null);
  const [location, setLocation] = useState<IssueLocation>({ ...DEFAULT_MAP_CENTER });
  const [displayName, setDisplayName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [draft, setDraft] = useState<DraftAnalysisResult | null>(null);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [issue, setIssue] = useState<Issue | null>(null);

  useEffect(() => {
    if (user?.displayName && !displayName) setDisplayName(user.displayName);
    // Only auto-fill once when the session finishes restoring; never overwrite what the citizen typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleAnalyze() {
    if (description.trim().length < 10 && !photo) {
      setFormError("Please add a photo or at least a short description (10+ characters) so AI can analyze the issue.");
      return;
    }
    setFormError(null);
    setStage("analyzing");

    const payload: CreateIssuePayload = {
      title: "",
      description: description.trim() || "No description provided; classification is based on the photo.",
      category: category || undefined,
      location,
      imageBase64: photo,
      reporterDisplayName: displayName.trim() || undefined,
      isPublic: true,
    };

    const [result] = await Promise.all([analyzeIssueDraft(payload), wait(2600)]);
    setDraft(result);
    setTitle(result.suggestedTitle);
    setStage("result");
  }

  async function handleSubmit() {
    if (!draft) return;
    setSubmitting(true);
    const payload: CreateIssuePayload = {
      title,
      description: description.trim() || "No description provided; classification is based on the photo.",
      category: draft.analysis.detectedCategory,
      location,
      imageBase64: photo,
      reporterDisplayName: displayName.trim() || undefined,
      isPublic: true,
    };
    try {
      const created = await createIssue(payload, draft);
      setIssue(created);
      setStage("success");
      show({ kind: "success", title: "Report submitted", description: `Tracking ID ${created.trackingId}` });
    } catch (err) {
      console.error("Failed to submit report", err);
      show({ kind: "error", title: "Couldn't submit report", description: "Please try again in a moment." });
    } finally {
      setSubmitting(false);
    }
  }

  function resetAll() {
    setStage("form");
    setPhoto(null);
    setDescription("");
    setCategory(null);
    setLocation({ ...DEFAULT_MAP_CENTER });
    setDisplayName("");
    setDraft(null);
    setTitle("");
    setIssue(null);
    setFormError(null);
  }

  return (
    <div className="container max-w-3xl py-10 sm:py-14">
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700">
          <Sparkles className="h-3.5 w-3.5" /> AI-Assisted Reporting
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Report a Problem</h1>
        <p className="mt-2 text-muted-foreground">
          Add a photo and a short description — Nivaran AI handles classification, severity and priority.
        </p>
      </div>

      {stage === "form" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card>
            <CardContent className="space-y-8 pt-6">
              <section>
                <h2 className="mb-3 text-sm font-semibold text-foreground">1. What’s the problem?</h2>
                <UploadZone value={photo} onChange={(v, err) => { setPhoto(v); setPhotoError(err || null); }} error={photoError} />

                <div className="mt-4">
                  <label htmlFor="description" className="mb-1 block text-xs font-medium text-slate-600">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe what you see — e.g. 'Deep pothole near the bus stop causing two-wheelers to swerve.'"
                    className="w-full rounded-xl border border-border p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  />
                </div>

                <div className="mt-4">
                  <VoiceRecorder onTranscript={(text) => setDescription((d) => (d ? `${d} ${text}` : text))} />
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-slate-600">Category (optional — AI will suggest one)</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCategory(null)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95",
                        category === null
                          ? "border-primary-600 bg-primary-50 text-primary-700"
                          : "border-border text-slate-500 hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-700"
                      )}
                    >
                      Let AI decide
                    </button>
                    {ISSUE_CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95",
                          category === c.value
                            ? "border-primary-600 bg-primary-50 text-primary-700"
                            : "border-border text-slate-500 hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-700"
                        )}
                      >
                        {c.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-sm font-semibold text-foreground">2. Where is it?</h2>
                <LocationPicker value={location} onChange={setLocation} />
              </section>

              <section>
                <label htmlFor="displayName" className="mb-1 block text-xs font-medium text-slate-600">
                  Your name (optional — shown as “Anonymous Citizen” if left blank)
                </label>
                <input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Rohan P."
                  className="h-10 w-full max-w-xs rounded-lg border border-border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
              </section>

              {formError && <p className="text-sm text-critical-600">{formError}</p>}

              <Button onClick={handleAnalyze} size="lg" className="w-full" rightIcon={<Sparkles className="h-4 w-4" />}>
                Analyze with AI
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {stage === "analyzing" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <ScanningAnimation />
        </motion.div>
      )}

      {stage === "result" && draft && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
          <AIAnalysisCard analysis={draft.analysis} priority={draft.priority} />
          <PossibleDuplicatesList issues={draft.possibleDuplicates} />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label htmlFor="title" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <PenLine className="h-3.5 w-3.5" /> Report title
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" onClick={() => setStage("form")} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Edit report
                </Button>
                <Button onClick={handleSubmit} loading={submitting} className="flex-1" rightIcon={<CheckCircle2 className="h-4 w-4" />}>
                  Confirm & Submit Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {stage === "success" && issue && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <Card className="overflow-hidden text-center">
            <div className="bg-gradient-to-br from-success-500 to-emerald-500 px-6 py-10 text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20"
              >
                <CheckCircle2 className="h-9 w-9" />
              </motion.div>
              <h2 className="mt-4 text-2xl font-bold">Report submitted successfully</h2>
              <p className="mt-1 text-white/90">Thank you for helping improve your neighborhood.</p>
            </div>
            <CardContent className="space-y-5 pt-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Your Tracking ID</p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold tracking-wide text-primary-700">{issue.trackingId}</p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(issue.trackingId);
                      show({ kind: "info", title: "Copied to clipboard" });
                    }}
                    aria-label="Copy tracking ID"
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                  >
                    <ClipboardCopy className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Save this ID to track your report’s progress anytime.</p>
              </div>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button href={`/issues/${issue.id}`} rightIcon={<MapIcon className="h-4 w-4" />}>
                  View Report
                </Button>
                <Button variant="outline" onClick={resetAll} leftIcon={<RotateCcw className="h-4 w-4" />}>
                  Report Another Problem
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
